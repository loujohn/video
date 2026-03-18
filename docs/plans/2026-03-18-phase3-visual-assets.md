# Phase 3：视觉与资源 — 实施计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 实现分镜管理（CRUD + 拖拽排序）、资源库（上传/浏览/关联）、文件存储服务（本地 + 可配置 S3/MinIO）、图片/音频/视频预览，补齐短剧视觉生产链路。

**Architecture:** 延续 Phase 2 的三层架构。新增 StoryboardModel/Service、AssetModel/Service、StorageService。文件上传通过 multipart API 处理，存储路径可配置本地或 S3 兼容。前端通过 `useApi` 调用 API，分镜页支持拖拽排序，资源库支持上传、筛选、预览。

**Tech Stack:** Nuxt 3, Vue 3, TypeScript, Knex.js, PostgreSQL, Shadcn-vue, TailwindCSS v4, Lucide icons, formidable（文件上传）, vuedraggable（拖拽排序）

**Design Doc:** `docs/plans/2026-03-18-short-drama-platform-design.md`

**IMPORTANT - Nuxt Component Naming:** Nuxt 3 deduplicates auto-import component names. When file name starts with directory name, prefix is NOT doubled:
- `components/project/ProjectCard.vue` → use `<ProjectCard>` (NOT `<ProjectProjectCard>`)
- `components/project/ProjectSubNav.vue` → use `<ProjectSubNav>` (NOT `<ProjectProjectSubNav>`)
- `components/project/CreateProjectDialog.vue` → use `<ProjectCreateProjectDialog>` (file doesn't start with dir name)
- `components/common/EmptyState.vue` → use `<CommonEmptyState>` (file doesn't start with dir name)

**IMPORTANT - `useApi` unwraps responses:** The `composables/useApi.ts` `$api` function unwraps `{ success: true, data: T }` and returns `T` directly. API handlers should use `ok(data)` from `server/utils/response.ts`.

**IMPORTANT - API Handler Pattern:** All API handlers MUST use `defineApiHandler` from `server/utils/handler.ts` to wrap the handler function. This converts `AppError` to H3 errors automatically.

**IMPORTANT - File Upload:** 使用 `formidable` 或 `readMultipartFormData` 处理 multipart/form-data。上传 API 需支持 `useApi` 的 `$api` 调用（需处理 FormData 或 base64，或使用独立 `$fetch` 传 FormData）。

---

## 数据库表结构说明

现有 migration `20260318000000_initial.ts` 已创建 `storyboards` 和 `assets` 表。Phase 3 设计文档中的扩展字段（如 `reference_image_url`、`camera_movement`、`transition_type`、`sound_effects`）需通过新增 migration 补齐，见 Batch 1。

### storyboards 表（现有 + 扩展）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| episode_id | uuid FK | 所属分集 |
| sequence_number | int | 镜头序号 |
| shot_type | varchar | 镜头类型(close/medium/wide/pov/establishing) |
| scene_id | uuid FK nullable | 关联场景 |
| description | text | 画面描述 |
| dialogue | text | 台词 |
| action_direction | text | 动作指示 |
| music_cue | text | 音乐/音效描述 |
| duration_seconds | decimal | 时长 |
| reference_image_url | text | 参考图/生成图 URL（需 migration 添加） |
| camera_movement | varchar | 机位运动（需 migration 添加） |
| transition_type | varchar | 转场类型(cut/dissolve/fade/wipe)（需 migration 添加） |
| is_active | boolean | |
| created_at | timestamp | |
| updated_at | timestamp | |

### assets 表（现有）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| project_id | uuid FK | |
| type | varchar | image/audio/video |
| category | varchar | character_portrait/scene_bg/storyboard_frame 等 |
| file_path | text | 存储路径 |
| file_name | varchar | 原始文件名 |
| file_size | bigint | 文件大小 |
| mime_type | varchar | MIME 类型 |
| metadata | jsonb | 额外元数据(宽高/时长等) |
| linked_entity_type | varchar | 关联实体类型(character/scene/prop/storyboard/episode/project) |
| linked_entity_id | uuid | 关联实体 ID |
| is_active | boolean | |
| created_at | timestamp | |

若设计文档要求 `created_by`，需 migration 添加。

---

## File Structure

```
migrations/
└── 20260318100000_phase3_storyboard_assets.ts   # 新建: storyboards 扩展字段

core/
├── models/
│   ├── storyboard.model.ts                      # 新建: 分镜 CRUD + reorder
│   └── asset.model.ts                           # 新建: 资源 CRUD + 按实体筛选
├── services/
│   ├── storyboard.service.ts                    # 新建: 分镜业务 + 权限
│   ├── asset.service.ts                         # 新建: 资源业务 + 权限
│   └── storage.service.ts                       # 新建: 文件存储（本地/S3）
└── types/
    └── storyboard.ts                            # 修改: 扩展 CreateStoryboardInput
    └── asset.ts                                 # 修改: 扩展 CreateAssetInput

server/api/projects/[id]/
├── episodes/[num]/
│   └── storyboards/
│       ├── index.get.ts                         # 新建: 分镜列表
│       ├── index.post.ts                        # 新建: 新建分镜
│       ├── reorder.put.ts                       # 新建: 拖拽排序
│       └── [sid]/
│           ├── index.get.ts                     # 新建: 分镜详情
│           ├── index.put.ts                     # 新建: 更新分镜
│           └── index.delete.ts                   # 新建: 删除分镜
└── assets/
    ├── index.get.ts                             # 新建: 资源列表（筛选）
    ├── index.post.ts                            # 新建: 上传资源
    └── [aid]/
        ├── index.get.ts                         # 新建: 资源详情
        ├── index.put.ts                         # 新建: 更新关联
        └── index.delete.ts                      # 新建: 删除资源

server/utils/
└── upload.ts                                    # 新建: formidable 解析封装

components/
├── project/
│   ├── ProjectSubNav.vue                        # 修改: 增加分镜、资源库导航
│   ├── StoryboardCard.vue                       # 新建: 分镜卡片
│   ├── StoryboardFormDialog.vue                 # 新建: 分镜编辑弹窗
│   ├── AssetUploadZone.vue                      # 新建: 上传区域
│   ├── AssetCard.vue                            # 新建: 资源卡片
│   └── AssetPreviewDialog.vue                   # 新建: 图片/音频/视频预览
└── common/
    └── ConfirmDialog.vue                        # 已有，用于删除确认

pages/projects/[id]/
├── episodes/[num]/
│   └── storyboards.vue                          # 新建: 分镜管理页（含拖拽）
└── assets.vue                                    # 新建: 资源库页
```

---

## Batch 1: 分镜 Models + Services + API（后端）

### Task 1.1: Migration 扩展 storyboards 表

**Files:**
- Create: `migrations/20260318100000_phase3_storyboard_assets.ts`

**Action:** 为 storyboards 添加 `reference_image_url`、`camera_movement`、`transition_type`；若 assets 需 `created_by` 则一并添加。

```typescript
// migrations/20260318100000_phase3_storyboard_assets.ts
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('storyboards', (t) => {
    t.text('reference_image_url')
    t.string('camera_movement')
    t.string('transition_type')
  })
  // 可选: assets 添加 created_by
  await knex.schema.alterTable('assets', (t) => {
    t.uuid('created_by').references('id').inTable('users').onDelete('SET NULL')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('storyboards', (t) => {
    t.dropColumn('reference_image_url')
    t.dropColumn('camera_movement')
    t.dropColumn('transition_type')
  })
  await knex.schema.alterTable('assets', (t) => {
    t.dropColumn('created_by')
  })
}
```

- [x] **Step 1:** 创建 migration 文件并执行 `npx knex migrate:latest`

### Task 1.2: Storyboard Model + Types

**Files:**
- Modify: `core/types/storyboard.ts`
- Create: `core/models/storyboard.model.ts`

**Pattern** (参考 `core/models/scene.model.ts`):

```typescript
// core/types/storyboard.ts - 扩展
export interface CreateStoryboardInput {
  sequence_number: number
  shot_type?: string
  scene_id?: string
  description?: string
  dialogue?: string
  action_direction?: string
  music_cue?: string
  duration_seconds?: number
  reference_image_url?: string
  camera_movement?: string
  transition_type?: string
}
```

```typescript
// core/models/storyboard.model.ts
import { getDb } from '../db'
import type { Storyboard, CreateStoryboardInput } from '../types'

const TABLE = 'storyboards'

export const StoryboardModel = {
  async findById(id: string): Promise<Storyboard | undefined> {
    return getDb()(TABLE).where({ id }).first()
  },

  async findByEpisode(episodeId: string): Promise<Storyboard[]> {
    return getDb()(TABLE)
      .where({ episode_id: episodeId })
      .orderBy('sequence_number', 'asc')
  },

  async create(episodeId: string, input: CreateStoryboardInput): Promise<Storyboard> {
    const maxSeq = await getDb()(TABLE)
      .where({ episode_id: episodeId })
      .max('sequence_number as max')
      .first()
    const [row] = await getDb()(TABLE)
      .insert({
        episode_id: episodeId,
        sequence_number: input.sequence_number ?? ((maxSeq?.max || 0) + 1),
        shot_type: input.shot_type ?? null,
        scene_id: input.scene_id ?? null,
        description: input.description ?? null,
        dialogue: input.dialogue ?? null,
        action_direction: input.action_direction ?? null,
        music_cue: input.music_cue ?? null,
        duration_seconds: input.duration_seconds ?? null,
        reference_image_url: input.reference_image_url ?? null,
        camera_movement: input.camera_movement ?? null,
        transition_type: input.transition_type ?? null,
      })
      .returning('*')
    return row
  },

  async update(id: string, data: Partial<CreateStoryboardInput> & { is_active?: boolean }): Promise<Storyboard | undefined> {
    const updateData: Record<string, unknown> = { updated_at: new Date() }
    // 按需添加字段
    const [row] = await getDb()(TABLE).where({ id }).update(updateData).returning('*')
    return row
  },

  async delete(id: string): Promise<boolean> {
    const count = await getDb()(TABLE).where({ id }).del()
    return count > 0
  },

  async reorder(episodeId: string, orderedIds: string[]): Promise<void> {
    const db = getDb()
    for (let i = 0; i < orderedIds.length; i++) {
      await db(TABLE).where({ id: orderedIds[i], episode_id: episodeId }).update({ sequence_number: i + 1, updated_at: new Date() })
    }
  },
}
```

- [x] **Step 1:** 修改 `core/types/storyboard.ts` 扩展 CreateStoryboardInput
- [x] **Step 2:** 创建 `core/models/storyboard.model.ts`

### Task 1.3: Storyboard Service

**Files:**
- Create: `core/services/storyboard.service.ts`

**Pattern** (参考 `core/services/scene.service.ts`):

```typescript
import { StoryboardModel } from '../models/storyboard.model'
import { EpisodeModel } from '../models/episode.model'
import { ProjectService } from './project.service'
import { notFoundError } from '../errors'
import type { Storyboard, CreateStoryboardInput } from '../types'

export const StoryboardService = {
  async list(projectId: string, episodeNum: number, userId: string): Promise<Storyboard[]> {
    await ProjectService.getProject(projectId, userId)
    const episode = await EpisodeModel.findByNumber(projectId, episodeNum)
    if (!episode) notFoundError('分集不存在')
    return StoryboardModel.findByEpisode(episode.id)
  },

  async get(projectId: string, episodeNum: number, storyboardId: string, userId: string): Promise<Storyboard> {
    await ProjectService.getProject(projectId, userId)
    const episode = await EpisodeModel.findByNumber(projectId, episodeNum)
    if (!episode) notFoundError('分集不存在')
    const sb = await StoryboardModel.findById(storyboardId)
    if (!sb || sb.episode_id !== episode.id) notFoundError('分镜不存在')
    return sb
  },

  async create(projectId: string, episodeNum: number, input: CreateStoryboardInput, userId: string): Promise<Storyboard> {
    await ProjectService.getProject(projectId, userId)
    const episode = await EpisodeModel.findByNumber(projectId, episodeNum)
    if (!episode) notFoundError('分集不存在')
    return StoryboardModel.create(episode.id, input)
  },

  async update(projectId: string, episodeNum: number, storyboardId: string, data: Partial<CreateStoryboardInput> & { is_active?: boolean }, userId: string): Promise<Storyboard> {
    await this.get(projectId, episodeNum, storyboardId, userId)
    const updated = await StoryboardModel.update(storyboardId, data)
    if (!updated) notFoundError('更新失败')
    return updated
  },

  async delete(projectId: string, episodeNum: number, storyboardId: string, userId: string): Promise<void> {
    await this.get(projectId, episodeNum, storyboardId, userId)
    await StoryboardModel.delete(storyboardId)
  },

  async reorder(projectId: string, episodeNum: number, orderedIds: string[], userId: string): Promise<void> {
    await ProjectService.getProject(projectId, userId)
    const episode = await EpisodeModel.findByNumber(projectId, episodeNum)
    if (!episode) notFoundError('分集不存在')
    await StoryboardModel.reorder(episode.id, orderedIds)
  },
}
```

- [x] **Step 1:** 创建 `core/services/storyboard.service.ts`

### Task 1.4: Storyboard API 路由

**Files:**
- Create: `server/api/projects/[id]/episodes/[num]/storyboards/index.get.ts`
- Create: `server/api/projects/[id]/episodes/[num]/storyboards/index.post.ts`
- Create: `server/api/projects/[id]/episodes/[num]/storyboards/reorder.put.ts`
- Create: `server/api/projects/[id]/episodes/[num]/storyboards/[sid]/index.get.ts`
- Create: `server/api/projects/[id]/episodes/[num]/storyboards/[sid]/index.put.ts`
- Create: `server/api/projects/[id]/episodes/[num]/storyboards/[sid]/index.delete.ts`

**Pattern** (参考 `server/api/projects/[id]/scenes/index.get.ts`):

```typescript
// index.get.ts
import { StoryboardService } from '~/core/services/storyboard.service'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const num = parseInt(getRouterParam(event, 'num')!, 10)
  const list = await StoryboardService.list(projectId, num, userId)
  return ok(list)
})

// index.post.ts
import { StoryboardService } from '~/core/services/storyboard.service'
import { ok, badRequest } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const num = parseInt(getRouterParam(event, 'num')!, 10)
  const body = await readBody(event)
  if (body.sequence_number == null) body.sequence_number = 999 // 默认追加末尾
  return ok(await StoryboardService.create(projectId, num, body, userId))
})

// reorder.put.ts
export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const num = parseInt(getRouterParam(event, 'num')!, 10)
  const body = await readBody(event)
  if (!Array.isArray(body.ids)) throw createError({ statusCode: 400, statusMessage: 'ids 必填且为数组' })
  await StoryboardService.reorder(projectId, num, body.ids, userId)
  return ok({ reordered: true })
})
```

- [x] **Step 1:** 创建 storyboards index.get / index.post
- [x] **Step 2:** 创建 storyboards reorder.put
- [x] **Step 3:** 创建 storyboards/[sid] index.get / index.put / index.delete

---

## Batch 2: 文件存储服务 + 资源上传 API

### Task 2.1: Storage Service（本地 + S3 兼容）

**Files:**
- Create: `core/services/storage.service.ts`
- Create: `server/utils/upload.ts`（formidable 封装）

**环境变量建议:**
- `STORAGE_TYPE`: `local` | `s3`
- `STORAGE_LOCAL_PATH`: 本地存储根目录，默认 `./uploads`
- `STORAGE_S3_ENDPOINT`、`STORAGE_S3_BUCKET`、`STORAGE_S3_ACCESS_KEY`、`STORAGE_S3_SECRET_KEY`（S3/MinIO）

**StorageService 接口:**

```typescript
// core/services/storage.service.ts
export const StorageService = {
  async saveFile(projectId: string, file: { buffer: Buffer; originalFilename: string; mimetype: string }): Promise<{ path: string; url: string }> {
    // 生成路径: projects/{projectId}/assets/{uuid}-{sanitizedFilename}
    // 本地: 写入 STORAGE_LOCAL_PATH/path，返回 /uploads/path 或静态 URL
    // S3: 上传到 bucket，返回 public URL 或 presigned path
  },

  async deleteFile(path: string): Promise<void> {
    // 根据 path 前缀判断本地/S3，执行删除
  },
}
```

**实现要点:**
- 本地存储：`path.join(process.cwd(), STORAGE_LOCAL_PATH, relativePath)`，静态文件通过 Nuxt `public` 或 `server/assets` 提供访问
- S3：使用 `@aws-sdk/client-s3` 或 `minio` 客户端
- 文件名需 sanitize，避免路径遍历

- [x] **Step 1:** 创建 `server/utils/upload.ts`，封装 `parseMultipartFormData(event)` 返回 `{ fields, files }`
- [x] **Step 2:** 创建 `core/services/storage.service.ts`，实现本地存储
- [x] **Step 3:** （可选）实现 S3 兼容存储，通过 `STORAGE_TYPE` 切换

### Task 2.2: Asset Model + Service

**Files:**
- Modify: `core/types/asset.ts`
- Create: `core/models/asset.model.ts`
- Create: `core/services/asset.service.ts`

**AssetModel 方法:**
- `findById(id)`
- `findByProject(projectId, filters?: { type?, linked_entity_type?, linked_entity_id? })`
- `create(projectId, input)`
- `update(id, data)`
- `delete(id)`

**AssetService:** 与 ProjectService 权限检查一致，所有操作前 `await ProjectService.getProject(projectId, userId)`。

- [x] **Step 1:** 修改 `core/types/asset.ts` 添加 CreateAssetInput
- [x] **Step 2:** 创建 `core/models/asset.model.ts`
- [x] **Step 3:** 创建 `core/services/asset.service.ts`

### Task 2.3: Asset 上传 API

**Files:**
- Create: `server/api/projects/[id]/assets/index.post.ts`
- Create: `server/api/projects/[id]/assets/index.get.ts`
- Create: `server/api/projects/[id]/assets/[aid]/index.get.ts`
- Create: `server/api/projects/[id]/assets/[aid]/index.put.ts`
- Create: `server/api/projects/[id]/assets/[aid]/index.delete.ts`

**上传 API 要点:**
- 使用 `readMultipartFormData` 或 formidable 解析
- 字段：`file`（文件）、`type`（image/audio/video）、`category`、`linked_entity_type`、`linked_entity_id`（可选）
- 调用 StorageService.saveFile，再 AssetModel.create 写入 DB
- 返回 `ok(asset)`

**列表 API 查询参数:**
- `type`: image | audio | video
- `linked_entity_type`, `linked_entity_id`: 按关联实体筛选

- [x] **Step 1:** 安装 `formidable`：`pnpm add formidable`，并添加类型
- [x] **Step 2:** 创建 assets index.post（上传）
- [x] **Step 3:** 创建 assets index.get（列表 + 筛选）
- [x] **Step 4:** 创建 assets/[aid] index.get / index.put / index.delete

### Task 2.4: 静态文件访问

**Files:**
- Modify: `nuxt.config.ts` 或添加 `server/routes/` 路由，使 `/uploads/**` 可访问

**实现:** 使用 `sendStream` 或配置 Nitro 静态资源，确保上传后的图片/音频/视频可通过 URL 访问。

- [x] **Step 1:** 配置 `/uploads` 静态访问或创建 `server/routes/uploads/[...path].get.ts`

---

## Batch 3: 分镜管理页面（CRUD + 拖拽排序）

### Task 3.1: 分镜管理页

**Files:**
- Create: `pages/projects/[id]/episodes/[num]/storyboards.vue`
- Modify: `pages/projects/[id]/episodes.vue` — 增加「分镜」入口链接
- Modify: `components/project/ProjectSubNav.vue` — 增加「分镜」导航（可选，因分镜在分集下）

**路由:** `/projects/:id/episodes/:num/storyboards`

**页面设计:**
- 顶部：返回按钮 + 「第 N 集分镜」标题
- 分镜列表：卡片网格或列表，每卡片显示：序号、镜头类型、画面描述摘要、参考图缩略图、时长
- 拖拽排序：使用 `vuedraggable`，`@end` 时调用 `PUT /api/projects/:id/episodes/:num/storyboards/reorder`，body: `{ ids: orderedIds }`
- 「新建分镜」按钮 → 打开 StoryboardFormDialog
- 每卡片有编辑、删除按钮

- [x] **Step 1:** 安装 `vuedraggable`：`pnpm add vuedraggable@next`（Vue 3 兼容）
- [x] **Step 2:** 创建 `components/project/StoryboardCard.vue`
- [x] **Step 3:** 创建 `components/project/StoryboardFormDialog.vue`（新建/编辑表单）
- [x] **Step 4:** 创建 `pages/projects/[id]/episodes/[num]/storyboards.vue`
- [x] **Step 5:** 在 `episodes.vue` 每行增加「分镜」链接

### Task 3.2: 分镜表单字段

**StoryboardFormDialog 表单字段:**
- sequence_number（可自动）
- shot_type（下拉：close/medium/wide/pov/establishing）
- scene_id（可选，关联场景下拉）
- description（画面描述）
- dialogue（台词）
- action_direction（动作指示）
- music_cue（音效/音乐）
- duration_seconds（时长）
- reference_image_url（参考图 URL，可后续与资源库关联）
- camera_movement（机位运动）
- transition_type（转场：cut/dissolve/fade/wipe）

- [x] **Step 1:** 实现 StoryboardFormDialog 完整表单
- [x] **Step 2:** 集成删除确认（CommonConfirmDialog）

---

## Batch 4: 资源库页面（上传、浏览、筛选、预览）

### Task 4.1: 资源库页

**Files:**
- Create: `pages/projects/[id]/assets.vue`
- Create: `components/project/AssetUploadZone.vue`
- Create: `components/project/AssetCard.vue`
- Create: `components/project/AssetPreviewDialog.vue`

**页面设计:**
- 顶部：项目标题 + 「资源库」
- 筛选栏：类型（图片/音频/视频）、关联实体（可选）
- 上传区域：拖拽或点击上传，支持多文件
- 资源网格：AssetCard 展示缩略图/图标、文件名、大小、关联实体
- 点击卡片 → 打开 AssetPreviewDialog（图片放大、音频播放器、视频播放器）

**AssetUploadZone:**
- 使用 `<input type="file" multiple>` 或拖拽区域
- 上传时构建 FormData，调用 `$fetch('/api/projects/:id/assets', { method: 'POST', body: formData })`
- 注意：`useApi` 的 `$api` 可能需扩展支持 FormData，或此处直接用 `$fetch` 并带 token

- [x] **Step 1:** 创建 `components/project/AssetUploadZone.vue`
- [x] **Step 2:** 创建 `components/project/AssetCard.vue`
- [x] **Step 3:** 创建 `components/project/AssetPreviewDialog.vue`（图片 img、音频 audio、视频 video）
- [x] **Step 4:** 创建 `pages/projects/[id]/assets.vue`

### Task 4.2: 上传与 useApi 兼容

若 `useApi` 的 `$api` 使用 `$fetch` 且未处理 FormData，可：
- 方案 A：在 assets 页单独使用 `$fetch` 上传，手动附加 `Authorization` header
- 方案 B：扩展 `useApi` 支持 `$upload(url, formData)` 方法

- [x] **Step 1:** 实现上传逻辑（方案 A 或 B）
- [x] **Step 2:** 上传成功后刷新资源列表

---

## Batch 5: 集成（资源关联、分镜参考图、SubNav）

### Task 5.1: 资源关联实体

**Files:**
- Modify: `components/project/AssetCard.vue` 或 `AssetPreviewDialog.vue` — 支持编辑关联实体
- Modify: `server/api/projects/[id]/assets/[aid]/index.put.ts` — 支持更新 `linked_entity_type`、`linked_entity_id`

**UI:** 在资源详情/编辑中，下拉选择关联类型（角色/场景/道具/分镜/分集/项目）和对应实体 ID。

- [x] **Step 1:** 实现 Asset 编辑关联实体
- [x] **Step 2:** 在资源库筛选时可按关联实体过滤

### Task 5.2: 分镜参考图与资源库联动

**实现:** 在 StoryboardFormDialog 中，`reference_image_url` 可：
- 手动输入 URL
- 或从资源库选择：打开资源选择器，筛选 type=image，选择后填入 asset 的访问 URL

- [x] **Step 1:** 创建 `components/project/AssetPickerDialog.vue`（可选，用于从资源库选图）
- [x] **Step 2:** 在 StoryboardFormDialog 中集成「从资源库选择」按钮

### Task 5.3: SubNav 更新

**Files:**
- Modify: `components/project/ProjectSubNav.vue`

**新增导航项:**
- 分镜：`/projects/:id/episodes` 下通过分集进入，或增加「分镜」入口到第一集
- 资源库：`/projects/:id/assets`

设计文档中 SubNav 已有：概览、角色、场景与道具、分集、创作方案。新增：
- 分镜：可链接到 `/projects/:id/episodes/1/storyboards`（默认第一集）或单独「分镜」页按集筛选
- 资源库：`/projects/:id/assets`

- [x] **Step 1:** 在 ProjectSubNav 增加「资源库」链接
- [x] **Step 2:** 在 ProjectSubNav 增加「分镜」链接（指向第一集分镜或分镜汇总页，按设计选择）

---

## 验证清单

完成所有 Batch 后验证：
- [x] 分镜 CRUD：新建分镜 → 编辑 → 删除 → 确认
- [x] 分镜拖拽排序：调整顺序 → 保存 → 刷新确认顺序
- [x] 资源上传：上传图片/音频/视频 → 列表显示
- [x] 资源筛选：按类型、关联实体筛选
- [x] 资源预览：图片放大、音频播放、视频播放
- [x] 资源关联：编辑资源的关联实体
- [x] 分镜参考图：从资源库选择或输入 URL
- [x] SubNav：分镜、资源库入口可正确导航
- [x] 本地存储：上传文件存在于 `uploads/` 目录
- [x] （若启用 S3）S3 上传与访问正常
