# Phase 2b: 高级前端交互 — 实施计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补齐所有资源的完整 CRUD 交互，新增创作方案编辑页、剧本编辑器、角色关系管理和版本历史展示，使平台成为可用的端到端短剧创作管理工具。

**Architecture:** 延续 Phase 2a 的三层架构。新增 DELETE API 路由补齐 CRUD，新增创作方案和剧本编辑的前端页面，新增版本历史侧边栏组件。所有前端操作通过 `useApi` composable 调用后端 API。

**Tech Stack:** Nuxt 3, Vue 3, TypeScript, Knex.js, PostgreSQL, Shadcn-vue, TailwindCSS v4, Lucide icons

**Design Doc:** `docs/plans/2026-03-18-short-drama-platform-design.md`

**IMPORTANT - Nuxt Component Naming:** Nuxt 3 deduplicates auto-import component names. When file name starts with directory name, prefix is NOT doubled:
- `components/project/ProjectCard.vue` → use `<ProjectCard>` (NOT `<ProjectProjectCard>`)
- `components/project/ProjectSubNav.vue` → use `<ProjectSubNav>` (NOT `<ProjectProjectSubNav>`)
- `components/project/CreateProjectDialog.vue` → use `<ProjectCreateProjectDialog>` (file doesn't start with dir name)
- `components/common/EmptyState.vue` → use `<CommonEmptyState>` (file doesn't start with dir name)

**IMPORTANT - `useApi` unwraps responses:** The `composables/useApi.ts` `$api` function unwraps `{ success: true, data: T }` and returns `T` directly. API handlers should use `success(event, data)` from `server/utils/response.ts`.

**IMPORTANT - API Handler Pattern:** All API handlers MUST use `defineApiHandler` from `server/utils/handler.ts` to wrap the handler function. This converts `AppError` to H3 errors automatically.

---

## File Structure

```
core/
├── models/
│   ├── scene.model.ts                  # 修改: 增加 delete 方法
│   ├── prop.model.ts                   # 修改: 增加 delete 方法
│   └── episode.model.ts               # 修改: 增加 delete 方法
└── services/
    ├── scene.service.ts                # 修改: 增加 delete 方法
    ├── prop.service.ts                 # 修改: 增加 delete 方法
    └── episode.service.ts              # 修改: 增加 delete 方法

server/api/projects/[id]/
├── scenes/[sid]/index.delete.ts        # 新建: DELETE 场景
├── props/[pid]/index.delete.ts         # 新建: DELETE 道具
└── episodes/[num]/index.delete.ts      # 新建: DELETE 分集

components/
├── project/
│   ├── EditProjectDialog.vue           # 新建: 编辑项目弹窗
│   └── VersionHistorySheet.vue         # 新建: 版本历史侧边栏
└── ui/ (已有 shadcn 组件，无需新增)

pages/projects/[id]/
├── index.vue                           # 修改: 增加编辑项目入口
├── plan.vue                            # 新建: 创作方案编辑页
├── scenes.vue                          # 修改: 增加删除功能
├── episodes.vue                        # 修改: 增加删除功能 + 剧本入口
└── episodes/[num]/script.vue           # 新建: 剧本编辑页

pages/teams/index.vue                   # 修改: 增加编辑团队功能
components/project/ProjectSubNav.vue    # 修改: 增加创作方案导航项
```

---

## Batch 1: 补齐 DELETE API (后端)

### Task 1.1: Scene / Prop / Episode Models + Services 增加 delete

**Files:**
- Modify: `core/models/scene.model.ts` — 增加 `delete(id): Promise<boolean>`
- Modify: `core/models/prop.model.ts` — 增加 `delete(id): Promise<boolean>`
- Modify: `core/models/episode.model.ts` — 增加 `delete(id): Promise<boolean>`
- Modify: `core/services/scene.service.ts` — 增加 `delete(projectId, sceneId, userId)` 带权限检查
- Modify: `core/services/prop.service.ts` — 增加 `delete(projectId, propId, userId)` 带权限检查
- Modify: `core/services/episode.service.ts` — 增加 `delete(projectId, episodeNum, userId)` 带权限检查

**Pattern to follow** (参考 `core/models/character.model.ts:63-67`):

```typescript
// Model delete pattern
async delete(id: string): Promise<boolean> {
  const count = await db('table_name').where({ id }).del()
  return count > 0
}
```

```typescript
// Service delete pattern (参考 character.service.ts:33-40)
async delete(projectId: string, entityId: string, userId: string): Promise<void> {
  await this.projectService.checkAccess(projectId, userId)
  const entity = await this.model.findById(entityId)
  if (!entity || entity.project_id !== projectId) throw notFoundError('实体')
  await this.model.delete(entityId)
}
```

Episode 的 delete 特殊处理：按 `episode_number` 而非 `id`，需先查找 episode，还需删除关联的 `episode_scripts`：

```typescript
// episode.service.ts delete
async delete(projectId: string, episodeNum: number, userId: string): Promise<void> {
  await this.projectService.checkAccess(projectId, userId)
  const episode = await EpisodeModel.findByNumber(projectId, episodeNum)
  if (!episode) throw notFoundError('分集')
  await db('episode_scripts').where({ episode_id: episode.id }).del()
  await EpisodeModel.delete(episode.id)
}
```

- [ ] **Step 1:** 在 `core/models/scene.model.ts` 增加 `delete` 方法
- [ ] **Step 2:** 在 `core/models/prop.model.ts` 增加 `delete` 方法
- [ ] **Step 3:** 在 `core/models/episode.model.ts` 增加 `delete` 方法
- [ ] **Step 4:** 在 `core/services/scene.service.ts` 增加 `delete` 方法
- [ ] **Step 5:** 在 `core/services/prop.service.ts` 增加 `delete` 方法
- [ ] **Step 6:** 在 `core/services/episode.service.ts` 增加 `delete` 方法（含级联删除 scripts）

### Task 1.2: DELETE API 路由

**Files:**
- Create: `server/api/projects/[id]/scenes/[sid]/index.delete.ts`
- Create: `server/api/projects/[id]/props/[pid]/index.delete.ts`
- Create: `server/api/projects/[id]/episodes/[num]/index.delete.ts`

**Pattern** (参考 `server/api/projects/[id]/characters/[cid]/index.delete.ts`):

```typescript
import { SceneService } from '~/core/services/scene.service'
import { defineApiHandler } from '~/server/utils/handler'
import { success } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const projectId = getRouterParam(event, 'id')!
  const sceneId = getRouterParam(event, 'sid')!
  await new SceneService().delete(projectId, sceneId, event.context.userId)
  return success(event, null)
})
```

Episode DELETE 使用 `num` 参数（数字），需要 `parseInt`:

```typescript
const episodeNum = parseInt(getRouterParam(event, 'num')!, 10)
```

- [ ] **Step 1:** 创建 `server/api/projects/[id]/scenes/[sid]/index.delete.ts`
- [ ] **Step 2:** 创建 `server/api/projects/[id]/props/[pid]/index.delete.ts`
- [ ] **Step 3:** 创建 `server/api/projects/[id]/episodes/[num]/index.delete.ts`

---

## Batch 2: 补齐前端 CRUD 交互

### Task 2.1: 场景与道具删除功能

**Files:**
- Modify: `pages/projects/[id]/scenes.vue`

在场景列表和道具列表中增加删除按钮和确认弹窗。

**实现要点：**
- 在每个场景/道具卡片的编辑按钮旁增加删除按钮（红色 Trash2 图标）
- 点击删除弹出 `CommonConfirmDialog`
- 确认后调用 `$api('/api/projects/:id/scenes/:sid', { method: 'DELETE' })` 或 props 等价
- 删除成功后 refresh 列表

- [ ] **Step 1:** 在 scenes.vue 增加场景删除功能（按钮 + 确认弹窗 + API 调用）
- [ ] **Step 2:** 在 scenes.vue 增加道具删除功能（按钮 + 确认弹窗 + API 调用）

### Task 2.2: 分集删除功能

**Files:**
- Modify: `pages/projects/[id]/episodes.vue`

在分集列表表格中增加删除按钮。

- [ ] **Step 1:** 在 episodes.vue 增加分集删除功能（按钮 + 确认弹窗 + API 调用）

### Task 2.3: 项目编辑功能

**Files:**
- Create: `components/project/EditProjectDialog.vue`
- Modify: `pages/projects/[id]/index.vue`

**`EditProjectDialog.vue`** 类似 `CreateProjectDialog.vue`，但：
- 接收 `project` prop 预填充表单
- 调用 `PUT /api/projects/:id`
- 支持编辑：title, genre, audience, tone, ending_type, total_episodes, status

**`pages/projects/[id]/index.vue`** 修改：
- 在标题旁增加"编辑"按钮
- 点击打开 EditProjectDialog
- 编辑成功后 refresh 项目数据

- [ ] **Step 1:** 创建 `components/project/EditProjectDialog.vue`
- [ ] **Step 2:** 修改 `pages/projects/[id]/index.vue` 增加编辑入口

### Task 2.4: 团队编辑功能

**Files:**
- Modify: `pages/teams/index.vue`

在团队卡片增加编辑按钮，弹出编辑弹窗（复用 Dialog 模式），调用 `PUT /api/teams/:id`。

- [ ] **Step 1:** 在 `pages/teams/index.vue` 增加团队编辑功能

---

## Batch 3: 创作方案编辑页

### Task 3.1: 创作方案页面

**Files:**
- Create: `pages/projects/[id]/plan.vue`
- Modify: `components/project/ProjectSubNav.vue` — 增加"创作方案"导航项

**API:**
- `GET /api/projects/:id/plan` → 返回 `{ content: {}, version: N }`（如不存在返回空对象）
- `PUT /api/projects/:id/plan` → body: `{ content: {}, change_summary?: string }`

**创作方案 content 结构建议**（JSON object，前端用表单编辑）：

```typescript
interface CreativePlanContent {
  logline?: string          // 一句话故事梗概
  synopsis?: string         // 详细故事简介
  theme?: string            // 主题
  setting?: string          // 背景设定
  target_audience?: string  // 目标受众分析
  tone_style?: string       // 调性与风格描述
  key_conflicts?: string    // 核心冲突
  unique_selling_points?: string // 独特卖点
  reference_works?: string  // 参考作品
  notes?: string            // 其他备注
}
```

**页面设计：**
- SubNav 下方显示表单
- 每个字段使用 Label + Textarea 布局
- 底部显示当前版本号和"保存"按钮
- 保存时弹出输入 change_summary 的小弹窗
- 保存成功后刷新版本号

- [ ] **Step 1:** 修改 `ProjectSubNav.vue` 增加"创作方案"链接
- [ ] **Step 2:** 创建 `pages/projects/[id]/plan.vue`

---

## Batch 4: 剧本编辑器

### Task 4.1: 剧本编辑页面

**Files:**
- Create: `pages/projects/[id]/episodes/[num]/script.vue`
- Modify: `pages/projects/[id]/episodes.vue` — 增加"编辑剧本"入口链接

**API:**
- `GET /api/projects/:id/episodes/:num/scripts` → 返回最新剧本 `{ content, word_count, version, ... }` 或 null
- `POST /api/projects/:id/episodes/:num/scripts` → body: `{ content: string, change_summary?: string }` → 自动递增版本

**页面设计：**
- 顶部：返回按钮 + "第 N 集剧本" 标题 + 版本信息 + 保存按钮
- 主体：全高度 Textarea（Shadcn Textarea）用于纯文本/Markdown 编辑
- 底部状态栏：字数统计（自动计算）+ 最后保存时间
- 侧边可展开版本历史面板

**Episodes 页面修改：**
- 在分集列表中每行增加"编辑剧本"按钮/链接，点击导航到 `/projects/:id/episodes/:num/script`

- [ ] **Step 1:** 修改 `pages/projects/[id]/episodes.vue` 增加剧本编辑链接
- [ ] **Step 2:** 创建 `pages/projects/[id]/episodes/[num]/script.vue`

---

## Batch 5: 版本历史 + 角色关系

### Task 5.1: 版本历史侧边栏组件

**Files:**
- Create: `components/project/VersionHistorySheet.vue`

**Props:**
- `projectId: string`
- `entityType: string` (如 'creative_plans', 'episode_scripts')
- `entityId: string`
- `open: boolean`

**API:**
- `GET /api/projects/:id/versions?entity_type=X&entity_id=Y` → 返回版本列表

**UI:**
- 使用 Sheet 从右侧滑出
- 显示版本列表：版本号、变更摘要、时间、操作人
- 点击某个版本可查看该版本的 snapshot（展开 JSON）

- [ ] **Step 1:** 创建 `components/project/VersionHistorySheet.vue`
- [ ] **Step 2:** 在 `pages/projects/[id]/plan.vue` 集成版本历史按钮
- [ ] **Step 3:** 在 `pages/projects/[id]/episodes/[num]/script.vue` 集成版本历史按钮

### Task 5.2: 角色关系管理

**Files:**
- Modify: `pages/projects/[id]/characters.vue`

**API:**
- `GET /api/projects/:id/character-relations` → 返回关系列表 `[{ source_id, target_id, relation_type, description }]`
- `PUT /api/projects/:id/character-relations` → body: `{ relations: [...] }` 批量设置

**UI 设计（简化版，不做关系图）：**
- 在角色列表下方增加"角色关系"区域
- 使用表格列出所有关系：角色A → 关系类型 → 角色B → 描述
- "添加关系"按钮弹出 Sheet 表单：
  - 选择角色A（下拉）
  - 选择角色B（下拉）
  - 关系类型（输入）
  - 描述（输入）
- 保存时将全部关系作为数组 PUT 到 API

- [ ] **Step 1:** 在 `pages/projects/[id]/characters.vue` 增加角色关系管理区域

---

## 验证清单

完成所有 Batch 后验证：
- [ ] 场景删除：创建场景 → 删除 → 确认已移除
- [ ] 道具删除：创建道具 → 删除 → 确认已移除
- [ ] 分集删除：创建分集 → 删除 → 确认已移除
- [ ] 项目编辑：修改项目标题 → 刷新确认
- [ ] 创作方案：编辑内容 → 保存 → 刷新确认版本递增
- [ ] 剧本编辑：输入内容 → 保存 → 查看字数统计和版本
- [ ] 版本历史：在创作方案/剧本页查看历史版本
- [ ] 角色关系：添加关系 → 查看列表 → 删除关系
- [ ] 团队编辑：修改团队名 → 确认
