# Phase 4：评论/标注 + 通知系统 — 实施计划

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为短剧创作平台新增评论/标注系统和站内通知系统，使小团队（编剧+导演+制片）能够直接在平台内对剧本、分镜、角色、场景、道具、创作方案进行讨论和意见反馈，取代线下沟通，缩短反馈循环。

**Architecture:** 延续既有三层架构（Model → Service → API）。新增 CommentModel/Service、NotificationModel/Service。评论采用统一多态模型（entity_type + entity_id），通知在评论创建时同步触发。前端通过通用 CommentThread 组件嵌入各页面，通知通过导航栏铃铛 + 轮询实现。

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, Knex.js, PostgreSQL, Shadcn-vue, TailwindCSS v4, Lucide icons

**Design Decisions:**
- **评论粒度：** 分镜用卡片级评论（每张分镜卡片有独立评论流），剧本用实体级评论（针对整集剧本的评论流）。角色/场景/道具/创作方案用实体级评论。
- **通知范围：** MVP 先做纯站内通知（铃铛+通知中心），后续可扩展邮件/Webhook。
- **实时性：** MVP 用前端轮询（每 30s），后续可升级 WebSocket/SSE。

**IMPORTANT - Nuxt Component Naming:** 延续既有约定，`components/project/` 下文件以 `Project` 开头时组件名不重复前缀。

**IMPORTANT - `useApi` unwraps responses:** `$api` 自动解包 `{ success: true, data: T }`。

**IMPORTANT - API Handler Pattern:** 所有 API handler 使用 `defineApiHandler`。

---

## 数据库表结构

### comments 表（新建）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| project_id | uuid FK → projects | 方便权限检查和项目级查询 |
| entity_type | varchar | 'episode_script' \| 'storyboard' \| 'character' \| 'scene' \| 'prop' \| 'creative_plan' |
| entity_id | uuid | 关联实体 ID |
| parent_id | uuid FK nullable → comments | 回复的父评论，null=顶级评论 |
| content | text NOT NULL | 评论内容，支持 @提及 |
| mentions | uuid[] | 被 @提及的用户 ID 数组 |
| status | varchar DEFAULT 'open' | 'open' \| 'resolved' |
| created_by | uuid FK → users | |
| created_at | timestamp | |
| updated_at | timestamp | |

索引：
- `(project_id, entity_type, entity_id)` — 按实体查询评论
- `(parent_id)` — 查询回复
- `(created_by)` — 按用户查询

### notifications 表（新建）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| user_id | uuid FK → users | 通知接收人 |
| type | varchar | 'comment' \| 'mention' \| 'reply' \| 'status_change' |
| title | varchar | 简短标题 |
| content | text | 通知详情 |
| link | varchar | 点击跳转的前端路由 |
| is_read | boolean DEFAULT false | |
| related_entity_type | varchar nullable | |
| related_entity_id | uuid nullable | |
| created_by | uuid FK nullable → users | 触发人 |
| created_at | timestamp | |

索引：
- `(user_id, is_read, created_at DESC)` — 用户未读通知查询
- `(user_id, created_at DESC)` — 用户全部通知分页

---

## File Structure

```
migrations/
└── 20260319000000_comments_notifications.ts      # 新建: comments + notifications 表

core/
├── models/
│   ├── comment.model.ts                           # 新建: 评论 CRUD
│   └── notification.model.ts                      # 新建: 通知 CRUD
├── services/
│   ├── comment.service.ts                         # 新建: 评论业务 + 权限 + 触发通知
│   └── notification.service.ts                    # 新建: 通知业务
└── types/
    ├── comment.ts                                 # 新建: 评论类型定义
    └── notification.ts                            # 新建: 通知类型定义

server/api/
├── projects/[id]/
│   └── comments/
│       ├── index.get.ts                           # 新建: 评论列表
│       ├── index.post.ts                          # 新建: 创建评论
│       └── [cid]/
│           ├── index.put.ts                       # 新建: 编辑评论/标记解决
│           └── index.delete.ts                    # 新建: 删除评论
└── notifications/
    ├── index.get.ts                               # 新建: 通知列表
    ├── [nid]/
    │   └── read.put.ts                            # 新建: 标记单条已读
    └── read-all.put.ts                            # 新建: 全部标记已读

components/
├── common/
│   └── CommentThread.vue                          # 新建: 通用评论组件
├── layout/
│   ├── NotificationBell.vue                       # 新建: 导航栏铃铛
│   └── AppHeader.vue                              # 修改: 集成铃铛
└── project/
    └── StoryboardCard.vue                         # 修改: 增加评论按钮

pages/
├── notifications.vue                              # 新建: 通知中心
├── projects/[id]/
│   ├── episodes/[num]/
│   │   ├── script.vue                             # 修改: 集成评论面板
│   │   └── storyboards.vue                        # 修改: 分镜评论入口
│   ├── characters.vue                             # 修改: 角色评论入口
│   ├── scenes.vue                                 # 修改: 场景/道具评论入口
│   └── plan.vue                                   # 修改: 创作方案评论入口

composables/
└── useNotifications.ts                            # 新建: 通知轮询 composable

mcp/tools/
└── comment-tools.ts                               # 新建: MCP 评论工具
```

---

## Batch 1: 后端基础设施

### Task 1.1: Migration

**Files:**
- Create: `migrations/20260319000000_comments_notifications.ts`

```typescript
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('comments', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid())
    t.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE')
    t.string('entity_type').notNullable()
    t.uuid('entity_id').notNullable()
    t.uuid('parent_id').references('id').inTable('comments').onDelete('CASCADE')
    t.text('content').notNullable()
    t.specificType('mentions', 'uuid[]').defaultTo('{}')
    t.string('status').defaultTo('open')
    t.uuid('created_by').notNullable().references('id').inTable('users').onDelete('CASCADE')
    t.timestamps(true, true)
    t.index(['project_id', 'entity_type', 'entity_id'])
    t.index(['parent_id'])
    t.index(['created_by'])
  })

  await knex.schema.createTable('notifications', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid())
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
    t.string('type').notNullable()
    t.string('title').notNullable()
    t.text('content')
    t.string('link')
    t.boolean('is_read').defaultTo(false)
    t.string('related_entity_type')
    t.uuid('related_entity_id')
    t.uuid('created_by').references('id').inTable('users').onDelete('SET NULL')
    t.timestamp('created_at').defaultTo(knex.fn.now())
    t.index(['user_id', 'is_read', 'created_at'])
    t.index(['user_id', 'created_at'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('notifications')
  await knex.schema.dropTableIfExists('comments')
}
```

- [ ] **Step 1:** 创建 migration 文件

### Task 1.2: Types

**Files:**
- Create: `core/types/comment.ts`
- Create: `core/types/notification.ts`
- Modify: `core/types/index.ts` — 导出新类型

```typescript
// core/types/comment.ts
export type CommentEntityType = 'episode_script' | 'storyboard' | 'character' | 'scene' | 'prop' | 'creative_plan'
export type CommentStatus = 'open' | 'resolved'

export interface Comment {
  id: string
  project_id: string
  entity_type: CommentEntityType
  entity_id: string
  parent_id: string | null
  content: string
  mentions: string[]
  status: CommentStatus
  created_by: string
  created_at: Date
  updated_at: Date
}

export interface CommentWithAuthor extends Comment {
  author_name: string
  author_email: string
  replies?: CommentWithAuthor[]
}

export interface CreateCommentInput {
  entity_type: CommentEntityType
  entity_id: string
  content: string
  parent_id?: string
  mentions?: string[]
}

export interface UpdateCommentInput {
  content?: string
  status?: CommentStatus
}
```

```typescript
// core/types/notification.ts
export type NotificationType = 'comment' | 'mention' | 'reply' | 'status_change'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  content: string | null
  link: string | null
  is_read: boolean
  related_entity_type: string | null
  related_entity_id: string | null
  created_by: string | null
  created_at: Date
}

export interface NotificationWithActor extends Notification {
  actor_name?: string
}

export interface CreateNotificationInput {
  user_id: string
  type: NotificationType
  title: string
  content?: string
  link?: string
  related_entity_type?: string
  related_entity_id?: string
  created_by?: string
}
```

- [ ] **Step 1:** 创建 `core/types/comment.ts`
- [ ] **Step 2:** 创建 `core/types/notification.ts`
- [ ] **Step 3:** 在 `core/types/index.ts` 导出

### Task 1.3: Comment Model

**Files:**
- Create: `core/models/comment.model.ts`

**Pattern** (参考 `core/models/scene.model.ts`):

CommentModel 方法：
- `findByEntity(projectId, entityType, entityId)` — 返回带作者信息的评论列表，按时间排序
- `findById(id)` — 单条查询
- `create(projectId, input, userId)` — 创建评论
- `update(id, data)` — 更新评论内容或状态
- `delete(id)` — 删除评论
- `countByEntity(projectId, entityType, entityId)` — 返回评论数

查询时 JOIN users 表获取 `author_name` 和 `author_email`。
回复通过 `parent_id` 关联，查询后在 service 层组装树形结构。

- [ ] **Step 1:** 创建 `core/models/comment.model.ts`

### Task 1.4: Notification Model

**Files:**
- Create: `core/models/notification.model.ts`

NotificationModel 方法：
- `findByUser(userId, options: { isRead?: boolean, limit?, offset? })` — 分页查询
- `countUnread(userId)` — 未读计数
- `create(input)` — 创建通知
- `createBatch(inputs[])` — 批量创建通知
- `markRead(id, userId)` — 标记单条已读
- `markAllRead(userId)` — 全部标记已读

- [ ] **Step 1:** 创建 `core/models/notification.model.ts`

### Task 1.5: Comment Service

**Files:**
- Create: `core/services/comment.service.ts`

**核心逻辑：**
- 所有操作前通过 `ProjectService.getProject(projectId, userId)` 检查权限
- `create()` 时自动触发通知（见通知规则）
- `update()` 时如果标记 resolved，触发 status_change 通知
- 回复树组装：查询所有评论后，将 `parent_id` 非空的归入父评论的 `replies` 数组

**通知触发规则（在 CommentService.create 中实现）：**
1. 新评论 → 获取该项目的所有团队成员，排除评论作者，创建 type='comment' 通知
2. @提及 → 对 mentions 数组中的用户，创建 type='mention' 通知（优先于普通 comment 通知）
3. 回复评论 → 如果 parent_id 非空，对原评论作者创建 type='reply' 通知
4. 不通知自己

**通知 link 生成规则：**
- episode_script → `/projects/${projectId}/episodes/${episodeNum}/script`
- storyboard → `/projects/${projectId}/episodes/${episodeNum}/storyboards`
- character → `/projects/${projectId}/characters`
- scene/prop → `/projects/${projectId}/scenes`
- creative_plan → `/projects/${projectId}/plan`

需要根据 entity_type 和 entity_id 查询关联信息来生成正确的 link。

- [ ] **Step 1:** 创建 `core/services/comment.service.ts`

### Task 1.6: Notification Service

**Files:**
- Create: `core/services/notification.service.ts`

简单的查询/标记已读封装，无需复杂业务逻辑。

- [ ] **Step 1:** 创建 `core/services/notification.service.ts`

### Task 1.7: Comment API

**Files:**
- Create: `server/api/projects/[id]/comments/index.get.ts`
- Create: `server/api/projects/[id]/comments/index.post.ts`
- Create: `server/api/projects/[id]/comments/[cid]/index.put.ts`
- Create: `server/api/projects/[id]/comments/[cid]/index.delete.ts`

**API 详情：**

GET `/api/projects/:id/comments?entity_type=xxx&entity_id=xxx`
→ 返回该实体的评论列表（含嵌套回复和作者信息）

POST `/api/projects/:id/comments`
body: `{ entity_type, entity_id, content, parent_id?, mentions? }`
→ 创建评论，自动触发通知

PUT `/api/projects/:id/comments/:cid`
body: `{ content?, status? }`
→ 编辑评论内容或标记已解决

DELETE `/api/projects/:id/comments/:cid`
→ 删除评论（仅评论作者可删）

- [ ] **Step 1:** 创建 comments index.get / index.post
- [ ] **Step 2:** 创建 comments/[cid] index.put / index.delete

### Task 1.8: Notification API

**Files:**
- Create: `server/api/notifications/index.get.ts`
- Create: `server/api/notifications/[nid]/read.put.ts`
- Create: `server/api/notifications/read-all.put.ts`

GET `/api/notifications?is_read=false&limit=20&offset=0`
→ 返回 `{ notifications: [...], unread_count: number, total: number }`

PUT `/api/notifications/:nid/read`
→ 标记单条已读

PUT `/api/notifications/read-all`
→ 全部标记已读

- [ ] **Step 1:** 创建 notifications index.get
- [ ] **Step 2:** 创建 notifications read.put / read-all.put

---

## Batch 2: 通用前端组件

### Task 2.1: CommentThread 组件

**Files:**
- Create: `components/common/CommentThread.vue`

**Props:** `projectId: string, entityType: string, entityId: string`

**功能：**
- 自动加载该实体的评论列表
- 顶级评论 + 嵌套回复（一层嵌套，不做无限嵌套）
- 每条评论显示：作者头像（首字母）、作者名、时间、内容、状态标记
- 回复按钮 → 展开回复输入框
- 标记已解决按钮（将状态改为 resolved，显示为灰色划线）
- 新评论输入框在底部
- @提及自动补全：输入 @ 时显示团队成员下拉列表
- 空状态：「暂无评论，写下第一条意见吧」

**样式：** 延续项目现有设计风格（white card, zinc border, indigo accent）

- [ ] **Step 1:** 创建 CommentThread.vue
- [ ] **Step 2:** 实现 @提及自动补全（需获取团队成员列表）

### Task 2.2: NotificationBell 组件

**Files:**
- Create: `components/layout/NotificationBell.vue`

**功能：**
- 铃铛图标 + 未读数红色圆点
- 点击展开下拉面板（最近 10 条通知）
- 每条通知：类型图标、标题、时间、已读/未读状态
- 点击通知 → 标记已读 + 跳转到 link
- 底部「查看全部」链接 → 跳转 /notifications
- 「全部标记已读」按钮

- [ ] **Step 1:** 创建 NotificationBell.vue

### Task 2.3: useNotifications composable

**Files:**
- Create: `composables/useNotifications.ts`

**功能：**
- 轮询获取未读通知数（每 30s）
- 提供 `unreadCount`、`notifications`、`refresh()`
- 在 NotificationBell 和 AppHeader 中使用

- [ ] **Step 1:** 创建 useNotifications.ts

### Task 2.4: 通知中心页面

**Files:**
- Create: `pages/notifications.vue`

**功能：**
- 完整通知列表，分页
- 筛选 Tab：全部 / 未读 / 评论 / 提及
- 点击通知 → 标记已读 + 跳转
- 全部标记已读

- [ ] **Step 1:** 创建 notifications.vue

### Task 2.5: AppHeader 集成

**Files:**
- Modify: `components/layout/AppHeader.vue`

在 AppHeader 中集成 NotificationBell 组件，放在用户头像旁边。

- [ ] **Step 1:** 在 AppHeader 中加入 NotificationBell

---

## Batch 3: 评论集成到各页面

### Task 3.1: 分镜页评论

**Files:**
- Modify: `components/project/StoryboardCard.vue` — 增加评论按钮 + 评论数 badge
- Modify: `pages/projects/[id]/episodes/[num]/storyboards.vue` — 增加评论侧边栏

**交互：** 点击分镜卡片上的评论按钮 → 打开 Sheet 侧边栏，内容为 CommentThread（entityType='storyboard', entityId=该分镜ID）

- [ ] **Step 1:** StoryboardCard 增加评论按钮
- [ ] **Step 2:** storyboards.vue 集成评论 Sheet

### Task 3.2: 剧本页评论

**Files:**
- Modify: `pages/projects/[id]/episodes/[num]/script.vue`

**交互：** 在剧本编辑器下方或右侧增加可折叠的评论面板。CommentThread（entityType='episode_script', entityId=episode.id）

- [ ] **Step 1:** script.vue 集成评论面板

### Task 3.3: 角色页评论

**Files:**
- Modify: `pages/projects/[id]/characters.vue`

**交互：** 角色卡片增加评论按钮，点击打开 Sheet 侧边栏。CommentThread（entityType='character', entityId=角色ID）

- [ ] **Step 1:** characters.vue 集成评论功能

### Task 3.4: 场景/道具页评论

**Files:**
- Modify: `pages/projects/[id]/scenes.vue`

**交互：** 场景和道具卡片增加评论按钮，点击打开 Sheet。

- [ ] **Step 1:** scenes.vue 集成评论功能

### Task 3.5: 创作方案页评论

**Files:**
- Modify: `pages/projects/[id]/plan.vue`

**交互：** 在创作方案底部增加评论区域。CommentThread（entityType='creative_plan', entityId=plan.id）

- [ ] **Step 1:** plan.vue 集成评论面板

---

## Batch 4: MCP 工具 + 精装

### Task 4.1: MCP 评论工具

**Files:**
- Create: `mcp/tools/comment-tools.ts`

**工具列表：**
- `list_comments` — 查看某实体的评论
- `add_comment` — 添加评论
- `resolve_comment` — 标记评论已解决

- [ ] **Step 1:** 创建 comment-tools.ts
- [ ] **Step 2:** 在 MCP server 入口注册

### Task 4.2: 通知轮询优化

在 `useNotifications.ts` 中实现：
- 页面可见时轮询，隐藏时暂停
- 使用 `document.visibilitychange` 事件

- [ ] **Step 1:** 优化轮询逻辑

### Task 4.3: SubNav 评论计数

**Files:**
- Modify: `components/project/ProjectSubNav.vue`

为每个导航项旁增加评论数 badge（可选，如果开启的评论数 > 0 则显示）。

- [ ] **Step 1:** SubNav 增加评论计数

---

## 验证清单

完成所有 Batch 后验证：
- [ ] 评论 CRUD：新建 → 编辑 → 回复 → 标记解决 → 删除
- [ ] @提及：输入@弹出成员列表，选择后生成提及
- [ ] 通知触发：新评论/回复/@提及均正确生成通知
- [ ] 通知显示：铃铛未读数正确，点击跳转正确
- [ ] 通知标记已读：单条/全部标记
- [ ] 分镜评论：在分镜卡片上评论，评论数正确显示
- [ ] 剧本评论：剧本页评论面板正常工作
- [ ] 角色/场景/道具/方案评论：各页面评论正常
- [ ] 权限：只有项目团队成员可评论
- [ ] 不通知自己：自己的评论不产生给自己的通知
