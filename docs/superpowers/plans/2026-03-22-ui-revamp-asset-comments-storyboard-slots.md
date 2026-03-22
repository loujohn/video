# UI 改造 + 图片级评论 + 分镜关联 实现计划

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 改造角色/场景/道具/分镜的展示方式，增加详情页、图片级评论、分镜多 slot 和实体关联。

**Architecture:** 后端新增 prop_variants 表和两张分镜关联中间表，扩展分镜 CRUD 支持关联数据。前端新增 4 个详情页和 2 个通用组件（EntityThumbnailRow、ReferenceImageGallery），改造现有列表页卡片和 EntityImageGallery 组件。

**Tech Stack:** Nuxt 3, Vue 3, Knex/PostgreSQL, Zod, Vitest, MCP

**Spec:** `docs/superpowers/specs/2026-03-22-ui-revamp-asset-comments-storyboard-slots-design.md`

---

## Chunk 1: 数据库迁移 + 后端基础层（类型、Model、Service、Schema）

### Task 1: 数据库迁移

**Files:**
- Create: `migrations/20260322100000_prop_variants_storyboard_assoc.ts`

- [ ] **Step 1: 创建迁移文件**

```typescript
// migrations/20260322100000_prop_variants_storyboard_assoc.ts
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // prop_variants table
  await knex.schema.createTable('prop_variants', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('prop_id').notNullable().references('id').inTable('props').onDelete('CASCADE')
    t.string('name').notNullable()
    t.text('description')
    t.text('image_prompt')
    t.string('variant_type')
    t.integer('sort_order').defaultTo(0)
    t.boolean('is_active').defaultTo(true)
    t.timestamps(true, true)
    t.index('prop_id')
  })

  // storyboard_character_looks junction table
  await knex.schema.createTable('storyboard_character_looks', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('storyboard_id').notNullable().references('id').inTable('storyboards').onDelete('CASCADE')
    t.uuid('character_look_id').notNullable().references('id').inTable('character_looks').onDelete('CASCADE')
    t.integer('sort_order').defaultTo(0)
    t.timestamp('created_at').defaultTo(knex.fn.now())
    t.unique(['storyboard_id', 'character_look_id'])
    t.index('storyboard_id')
    t.index('character_look_id')
  })

  // storyboard_prop_variants junction table
  await knex.schema.createTable('storyboard_prop_variants', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('storyboard_id').notNullable().references('id').inTable('storyboards').onDelete('CASCADE')
    t.uuid('prop_variant_id').notNullable().references('id').inTable('prop_variants').onDelete('CASCADE')
    t.integer('sort_order').defaultTo(0)
    t.timestamp('created_at').defaultTo(knex.fn.now())
    t.unique(['storyboard_id', 'prop_variant_id'])
    t.index('storyboard_id')
    t.index('prop_variant_id')
  })

  // Add scene_variant_id to storyboards
  await knex.schema.alterTable('storyboards', (t) => {
    t.uuid('scene_variant_id').references('id').inTable('scene_variants').onDelete('SET NULL')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('storyboards', (t) => {
    t.dropColumn('scene_variant_id')
  })
  await knex.schema.dropTableIfExists('storyboard_prop_variants')
  await knex.schema.dropTableIfExists('storyboard_character_looks')
  await knex.schema.dropTableIfExists('prop_variants')
}
```

- [ ] **Step 2: 运行迁移**

```bash
cd /Users/loujohn/project/video && pnpm db:migrate
```

Expected: 迁移成功，新表和列已创建。

- [ ] **Step 3: 提交**

```bash
git add migrations/ && git commit -m "feat: add prop_variants table and storyboard association tables"
```

---

### Task 2: TypeScript 类型定义

**Files:**
- Create: `app/core/types/prop-variant.ts`
- Modify: `app/core/types/storyboard.ts`
- Modify: `app/core/types/index.ts`

- [ ] **Step 1: 创建 PropVariant 类型**

```typescript
// app/core/types/prop-variant.ts
export interface PropVariant {
  id: string
  prop_id: string
  name: string
  description: string | null
  image_prompt: string | null
  variant_type: string | null
  sort_order: number
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface CreatePropVariantInput {
  name: string
  description?: string
  image_prompt?: string
  variant_type?: string
  sort_order?: number
}
```

- [ ] **Step 2: 扩展 Storyboard 类型**

在 `app/core/types/storyboard.ts` 的 `Storyboard` 接口中增加：

```typescript
scene_variant_id: string | null
```

在 `CreateStoryboardInput` 中增加：

```typescript
scene_variant_id?: string | null
character_look_ids?: string[]
prop_variant_ids?: string[]
```

新增关联查询结果类型：

```typescript
export interface StoryboardWithAssociations extends Storyboard {
  scene_variant?: { id: string; name: string; scene_id: string; scene_name?: string } | null
  character_looks?: Array<{ id: string; name: string; character_id: string; character_name?: string }>
  prop_variants?: Array<{ id: string; name: string; prop_id: string; prop_name?: string }>
}
```

- [ ] **Step 3: 导出新类型**

在 `app/core/types/index.ts` 中增加：

```typescript
export * from './prop-variant'
```

- [ ] **Step 4: 提交**

```bash
git add app/core/types/ && git commit -m "feat: add PropVariant type and extend Storyboard with association fields"
```

---

### Task 3: Model 层

**Files:**
- Create: `app/core/models/prop-variant.model.ts`
- Create: `app/core/models/storyboard-character-look.model.ts`
- Create: `app/core/models/storyboard-prop-variant.model.ts`

- [ ] **Step 1: 写 PropVariant model 单元测试**

创建 `tests/models/prop-variant.model.test.ts`，测试 model 结构和字段映射（轻量 mock 测试）。

- [ ] **Step 2: 创建 PropVariantModel**

参照 `scene-variant.model.ts` 的结构，创建 `app/core/models/prop-variant.model.ts`：

```typescript
import { getDb, buildUpdateData } from '../db'
import type { PropVariant, CreatePropVariantInput } from '../types'

const TABLE = 'prop_variants'

export const PropVariantModel = {
  async findById(id: string): Promise<PropVariant | undefined> {
    return getDb()(TABLE).where({ id }).first()
  },

  async findByProp(propId: string): Promise<PropVariant[]> {
    return getDb()(TABLE)
      .where({ prop_id: propId, is_active: true })
      .orderBy('sort_order', 'asc')
  },

  async create(propId: string, input: CreatePropVariantInput): Promise<PropVariant> {
    const maxOrder = await getDb()(TABLE)
      .where({ prop_id: propId })
      .max('sort_order as max')
      .first()
    const [row] = await getDb()(TABLE)
      .insert({
        prop_id: propId,
        name: input.name,
        description: input.description ?? null,
        image_prompt: input.image_prompt ?? null,
        variant_type: input.variant_type ?? null,
        sort_order: input.sort_order ?? ((maxOrder?.max || 0) + 1),
      })
      .returning('*')
    return row
  },

  async update(id: string, data: Partial<CreatePropVariantInput> & { is_active?: boolean }): Promise<PropVariant | undefined> {
    const fields = ['name', 'description', 'image_prompt', 'variant_type', 'sort_order', 'is_active'] as const
    const updateData = buildUpdateData(data, fields)
    const [row] = await getDb()(TABLE).where({ id }).update(updateData).returning('*')
    return row
  },

  async delete(id: string): Promise<boolean> {
    const count = await getDb()(TABLE).where({ id }).del()
    return count > 0
  },
}
```

- [ ] **Step 3: 创建 StoryboardCharacterLookModel**

```typescript
// app/core/models/storyboard-character-look.model.ts
import { getDb } from '../db'

const TABLE = 'storyboard_character_looks'

export const StoryboardCharacterLookModel = {
  async findByStoryboard(storyboardId: string) {
    return getDb()(TABLE)
      .join('character_looks', 'character_looks.id', `${TABLE}.character_look_id`)
      .join('characters', 'characters.id', 'character_looks.character_id')
      .where(`${TABLE}.storyboard_id`, storyboardId)
      .orderBy(`${TABLE}.sort_order`, 'asc')
      .select(
        `${TABLE}.id`,
        `${TABLE}.character_look_id as id`,
        'character_looks.name',
        'character_looks.character_id',
        'characters.name as character_name',
      )
  },

  async findStoryboardsByCharacter(characterId: string): Promise<string[]> {
    const rows = await getDb()(TABLE)
      .join('character_looks', 'character_looks.id', `${TABLE}.character_look_id`)
      .where('character_looks.character_id', characterId)
      .select(`${TABLE}.storyboard_id`)
      .distinct()
    return rows.map(r => r.storyboard_id)
  },

  async sync(storyboardId: string, characterLookIds: string[]): Promise<void> {
    await getDb()(TABLE).where({ storyboard_id: storyboardId }).del()
    if (characterLookIds.length) {
      const rows = characterLookIds.map((id, i) => ({
        storyboard_id: storyboardId,
        character_look_id: id,
        sort_order: i,
      }))
      await getDb()(TABLE).insert(rows)
    }
  },
}
```

- [ ] **Step 4: 创建 StoryboardPropVariantModel**

```typescript
// app/core/models/storyboard-prop-variant.model.ts
import { getDb } from '../db'

const TABLE = 'storyboard_prop_variants'

export const StoryboardPropVariantModel = {
  async findByStoryboard(storyboardId: string) {
    return getDb()(TABLE)
      .join('prop_variants', 'prop_variants.id', `${TABLE}.prop_variant_id`)
      .join('props', 'props.id', 'prop_variants.prop_id')
      .where(`${TABLE}.storyboard_id`, storyboardId)
      .orderBy(`${TABLE}.sort_order`, 'asc')
      .select(
        `${TABLE}.id`,
        `${TABLE}.prop_variant_id as id`,
        'prop_variants.name',
        'prop_variants.prop_id',
        'props.name as prop_name',
      )
  },

  async findStoryboardsByProp(propId: string): Promise<string[]> {
    const rows = await getDb()(TABLE)
      .join('prop_variants', 'prop_variants.id', `${TABLE}.prop_variant_id`)
      .where('prop_variants.prop_id', propId)
      .select(`${TABLE}.storyboard_id`)
      .distinct()
    return rows.map(r => r.storyboard_id)
  },

  async sync(storyboardId: string, propVariantIds: string[]): Promise<void> {
    await getDb()(TABLE).where({ storyboard_id: storyboardId }).del()
    if (propVariantIds.length) {
      const rows = propVariantIds.map((id, i) => ({
        storyboard_id: storyboardId,
        prop_variant_id: id,
        sort_order: i,
      }))
      await getDb()(TABLE).insert(rows)
    }
  },
}
```

- [ ] **Step 5: 运行测试验证**

```bash
pnpm test --run
```

- [ ] **Step 6: 提交**

```bash
git add app/core/models/ tests/ && git commit -m "feat: add PropVariant, StoryboardCharacterLook, StoryboardPropVariant models"
```

---

### Task 4: Service 层

**Files:**
- Create: `app/core/services/prop-variant.service.ts`
- Modify: `app/core/services/storyboard.service.ts`

- [ ] **Step 1: 写 PropVariantService 单元测试**

创建 `tests/services/prop-variant.service.test.ts`。

- [ ] **Step 2: 创建 PropVariantService**

参照 `scene-variant.service.ts`，创建 `app/core/services/prop-variant.service.ts`：

```typescript
import { PropVariantModel } from '../models/prop-variant.model'
import { PropService } from './prop.service'
import { notFoundError } from '../errors'
import type { PropVariant, CreatePropVariantInput } from '../types'

export const PropVariantService = {
  async list(projectId: string, propId: string, userId: string): Promise<PropVariant[]> {
    await PropService.get(projectId, propId, userId)
    return PropVariantModel.findByProp(propId)
  },

  async get(projectId: string, propId: string, variantId: string, userId: string): Promise<PropVariant> {
    await PropService.get(projectId, propId, userId)
    const variant = await PropVariantModel.findById(variantId)
    if (!variant || variant.prop_id !== propId) notFoundError('道具变体不存在')
    return variant
  },

  async create(projectId: string, propId: string, input: CreatePropVariantInput, userId: string): Promise<PropVariant> {
    await PropService.get(projectId, propId, userId)
    return PropVariantModel.create(propId, input)
  },

  async update(projectId: string, propId: string, variantId: string, data: Partial<CreatePropVariantInput> & { is_active?: boolean }, userId: string): Promise<PropVariant> {
    await PropService.get(projectId, propId, userId)
    const variant = await PropVariantModel.findById(variantId)
    if (!variant || variant.prop_id !== propId) notFoundError('道具变体不存在')
    const updated = await PropVariantModel.update(variantId, data)
    if (!updated) notFoundError('更新失败')
    return updated
  },

  async delete(projectId: string, propId: string, variantId: string, userId: string): Promise<void> {
    await PropService.get(projectId, propId, userId)
    const variant = await PropVariantModel.findById(variantId)
    if (!variant || variant.prop_id !== propId) notFoundError('道具变体不存在')
    await PropVariantModel.delete(variantId)
  },
}
```

- [ ] **Step 3: 检查 PropService.get 是否存在**

读取 `app/core/services/prop.service.ts`，确认 `get` 方法存在且接受 `(projectId, propId, userId)` 参数。如果不存在需要补充。

- [ ] **Step 4: 扩展 StoryboardService**

在 `app/core/services/storyboard.service.ts` 中：
- `create` 方法：调用后同步 character_look_ids 和 prop_variant_ids
- `update` 方法：调用后同步关联
- 新增 `getWithAssociations` 方法，join 返回关联数据
- 新增 `findByCharacter(projectId, characterId, userId)` 反查方法
- 新增 `findByScene(projectId, sceneId, userId)` 反查方法
- 新增 `findByProp(projectId, propId, userId)` 反查方法

- [ ] **Step 5: 运行测试**

```bash
pnpm test --run
```

- [ ] **Step 6: 提交**

```bash
git add app/core/services/ tests/ && git commit -m "feat: add PropVariantService, extend StoryboardService with associations"
```

---

### Task 5: 请求校验 Schema

**Files:**
- Create: `server/schemas/prop-variant.ts`
- Modify: `server/schemas/storyboard.ts`

- [ ] **Step 1: 写 Schema 单元测试**

创建 `tests/schemas/prop-variant.test.ts`，参照 `tests/schemas/scene-variant.test.ts` 的结构。

- [ ] **Step 2: 创建 prop-variant schema**

```typescript
// server/schemas/prop-variant.ts
import { z } from 'zod/v4'

export const createPropVariantSchema = z.object({
  name: z.string().min(1, '变体名称必填').max(100),
  description: z.string().max(2000).optional(),
  image_prompt: z.string().max(5000).optional(),
  variant_type: z.preprocess(v => (v === '' ? undefined : v), z.enum(['style', 'condition', 'angle', 'detail']).optional()),
  sort_order: z.number().int().optional(),
})

export const updatePropVariantSchema = createPropVariantSchema.partial().extend({
  is_active: z.boolean().optional(),
})
```

- [ ] **Step 3: 扩展 storyboard schema**

在 `server/schemas/storyboard.ts` 的 `createStoryboardSchema` 中增加：

```typescript
scene_variant_id: z.string().uuid().optional().nullable(),
character_look_ids: z.array(z.string().uuid()).optional(),
prop_variant_ids: z.array(z.string().uuid()).optional(),
```

- [ ] **Step 4: 运行测试**

```bash
pnpm test --run
```

- [ ] **Step 5: 提交**

```bash
git add server/schemas/ tests/ && git commit -m "feat: add prop-variant schema, extend storyboard schema with association fields"
```

---

## Chunk 2: 后端 API 路由

### Task 6: 道具变体 CRUD API

**Files:**
- Create: `server/api/projects/[id]/props/[pid]/variants/index.get.ts`
- Create: `server/api/projects/[id]/props/[pid]/variants/index.post.ts`
- Create: `server/api/projects/[id]/props/[pid]/variants/[vid].put.ts`
- Create: `server/api/projects/[id]/props/[pid]/variants/[vid].delete.ts`

- [ ] **Step 1: 创建 GET list 路由**

参照 `server/api/projects/[id]/scenes/[sid]/variants/index.get.ts`。

- [ ] **Step 2: 创建 POST create 路由**

- [ ] **Step 3: 创建 PUT update 路由**

- [ ] **Step 4: 创建 DELETE 路由**

- [ ] **Step 5: curl 测试所有 CRUD 操作**

```bash
# 测试创建道具变体
curl -s -X POST "http://localhost:3001/api/projects/$PID/props/$PROP_ID/variants" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"特写版"}'
```

- [ ] **Step 6: 提交**

```bash
git add server/api/ && git commit -m "feat: add prop variant CRUD API routes"
```

---

### Task 7: 分镜 API 扩展（关联数据）

**Files:**
- Modify: `server/api/projects/[id]/episodes/[num]/storyboards/index.post.ts`
- Modify: `server/api/projects/[id]/episodes/[num]/storyboards/[sbid].put.ts`
- Modify: `server/api/projects/[id]/episodes/[num]/storyboards/index.get.ts`
- Modify: `server/api/projects/[id]/episodes/[num]/storyboards/[sbid].get.ts`（如存在）

- [ ] **Step 1: 修改分镜 POST/PUT 处理 character_look_ids、prop_variant_ids、scene_variant_id**

在创建/更新分镜后，调用 sync 方法同步关联关系。
设置 `scene_variant_id` 时自动推导并同步 `scene_id`。

- [ ] **Step 2: 修改分镜 GET 返回关联数据**

list 接口和 get 接口返回 `scene_variant`、`character_looks`、`prop_variants`。

- [ ] **Step 3: curl 测试**

```bash
# 创建分镜并关联角色形象
curl -s -X POST ".../storyboards" \
  -d '{"description":"测试","character_look_ids":["look-uuid"],"scene_variant_id":"variant-uuid"}'

# 查询分镜确认关联数据
curl -s "http://localhost:3001/api/projects/$PID/episodes/1/storyboards"
```

- [ ] **Step 4: 提交**

```bash
git add server/api/ && git commit -m "feat: extend storyboard API with character-look, prop-variant, scene-variant associations"
```

---

### Task 8: 反查 API（实体 → 关联分镜）

**Files:**
- Create: `server/api/projects/[id]/characters/[cid]/storyboards.get.ts`
- Create: `server/api/projects/[id]/scenes/[sid]/storyboards.get.ts`
- Create: `server/api/projects/[id]/props/[pid]/storyboards.get.ts`

- [ ] **Step 1: 角色反查分镜 API**

通过 `StoryboardCharacterLookModel.findStoryboardsByCharacter` 获取 storyboard_ids，然后查询分镜详情。

- [ ] **Step 2: 场景反查分镜 API**

通过 `storyboards.scene_variant_id` JOIN `scene_variants.scene_id` 来查找关联的分镜。

- [ ] **Step 3: 道具反查分镜 API**

通过 `StoryboardPropVariantModel.findStoryboardsByProp` 获取。

- [ ] **Step 4: curl 测试**

- [ ] **Step 5: 提交**

```bash
git add server/api/ && git commit -m "feat: add reverse lookup APIs for character/scene/prop to storyboards"
```

---

## Chunk 3: MCP 工具

### Task 9: 道具变体 MCP 工具

**Files:**
- Create: `mcp/tools/prop-variant-tools.ts`
- Modify: `mcp/server.ts`

- [ ] **Step 1: 创建 prop-variant-tools.ts**

参照 `mcp/tools/scene-variant-tools.ts`，实现 list/create/update/delete 四个工具。

- [ ] **Step 2: 注册到 server.ts**

- [ ] **Step 3: 提交**

```bash
git add mcp/ && git commit -m "feat: add prop variant MCP tools"
```

---

### Task 10: 分镜 MCP 工具更新

**Files:**
- Modify: `mcp/tools/storyboard-tools.ts`

- [ ] **Step 1: 扩展 create/update storyboard 工具**

增加 `scene_variant_id`、`character_look_ids`、`prop_variant_ids` 参数。

- [ ] **Step 2: 提交**

```bash
git add mcp/ && git commit -m "feat: update storyboard MCP tools with association params"
```

---

## Chunk 4: 前端通用组件

### Task 11: EntityThumbnailRow 组件

**Files:**
- Create: `app/components/project/EntityThumbnailRow.vue`

- [ ] **Step 1: 创建组件**

Props:
- `items: Array<{ id: string; name: string; coverUrl?: string | null }>`
- `maxVisible?: number` (默认 5)
- `size?: 'sm' | 'md'` (默认 'md')

Emits:
- `@select(item)` — 点击某个缩略图

功能：
- 圆角缩略图横排，下方带名称
- 溢出时显示左右翻页箭头
- 无 coverUrl 时显示灰色占位图标
- 有 coverUrl 但来自"未确认选定"时显示虚线边框（通过额外 prop `unconfirmedIds?: string[]` 标记）

- [ ] **Step 2: 提交**

```bash
git add app/components/ && git commit -m "feat: add EntityThumbnailRow component"
```

---

### Task 12: ReferenceImageGallery 组件

**Files:**
- Create: `app/components/project/ReferenceImageGallery.vue`

- [ ] **Step 1: 创建组件**

Props:
- `projectId: string`
- `entityType: string`
- `entityId: string`

功能：
- 查询 `category = 'reference_input'` 的 assets
- 显示缩略图网格
- 支持上传、查看大图、删除
- 不需要评论和选取功能
- 支持拖拽上传

- [ ] **Step 2: 提交**

```bash
git add app/components/ && git commit -m "feat: add ReferenceImageGallery component"
```

---

### Task 13: EntityImageGallery 增强（评论 + 封面逻辑）

**Files:**
- Modify: `app/components/project/EntityImageGallery.vue`

- [ ] **Step 1: 增加评论按钮**

每张候选图/视频 hover 时增加评论按钮（MessageSquare 图标）。
点击后打开 Sheet 显示 CommonCommentThread（`entity_type='asset', entity_id=asset.id`）。

- [ ] **Step 2: 批量加载评论计数**

调用 `/api/projects/:pid/comments/counts?entity_type=asset&entity_ids=id1&entity_ids=id2` 获取每个 asset 的评论数。
在缩略图上显示评论数角标。

- [ ] **Step 3: 改进封面逻辑**

将 `coverAsset` 的 `starred || active[0]` 改为：
- 有 `is_cover` → 选中（绿色边框 + 星标）
- 无 `is_cover` → `created_at` 最新的（虚线边框 + "未选定"标记）

确保 `activeAssets` 按 `created_at DESC` 排序。

- [ ] **Step 4: 提交**

```bash
git add app/components/ && git commit -m "feat: enhance EntityImageGallery with asset comments and improved cover logic"
```

---

## Chunk 5: 前端详情页 — 角色 & 场景

### Task 14: 角色列表页卡片改造

**Files:**
- Modify: `app/pages/projects/[id]/characters.vue`

- [ ] **Step 1: 去掉角色级评论**

删除评论按钮、commentTarget、showCommentSheet 及相关 Sheet 代码。

- [ ] **Step 2: 去掉展开/收起形象列表**

删除 expandedCharacter、looksMap、looksLoading、toggleCharacterExpand、loadLooks 等相关代码。

- [ ] **Step 3: 加载形象缩略图数据**

创建角色后自动加载所有角色的形象列表（带封面 URL），用于 EntityThumbnailRow。

- [ ] **Step 4: 集成 EntityThumbnailRow**

在卡片内替换原有形象展示区域，使用 EntityThumbnailRow 显示形象缩略图。
点击 → `navigateTo(/projects/${pid}/characters/${cid})`

- [ ] **Step 5: 添加「详情」按钮**

卡片操作栏增加「详情」按钮跳转到详情页。

- [ ] **Step 6: 提交**

```bash
git add app/pages/ && git commit -m "feat: redesign character cards with thumbnail row and detail navigation"
```

---

### Task 15: 角色详情页

**Files:**
- Create: `app/pages/projects/[id]/characters/[cid].vue`

- [ ] **Step 1: 创建详情页**

布局参照 spec 中的 ASCII 图：
- 顶部：返回按钮 + 编辑/删除操作
- 角色基本信息区
- 参考图区（ReferenceImageGallery）
- 形象管理区（每个形象一个可折叠 section，内嵌 EntityImageGallery）
- 角色关系区
- 关联分镜区（调用反查 API）

- [ ] **Step 2: 实现形象管理**

每个形象 section：
- 选中图大图
- 候选图网格（含评论、选取、废弃操作）
- 上传按钮
- 编辑形象名称/提示词

- [ ] **Step 3: 实现关联分镜区**

调用 `/api/projects/:pid/characters/:cid/storyboards` 获取关联分镜列表。

- [ ] **Step 4: 提交**

```bash
git add app/pages/ && git commit -m "feat: add character detail page with look management and associated storyboards"
```

---

### Task 16: 场景列表页卡片改造

**Files:**
- Modify: `app/pages/projects/[id]/scenes.vue`

- [ ] **Step 1: 去掉场景/道具级评论**

删除评论按钮和相关 Sheet。

- [ ] **Step 2: 去掉展开/收起变体列表**

- [ ] **Step 3: 加载变体/道具变体缩略图数据**

- [ ] **Step 4: 集成 EntityThumbnailRow**

场景卡片和道具卡片分别使用 EntityThumbnailRow。

- [ ] **Step 5: 添加「详情」按钮**

- [ ] **Step 6: 提交**

```bash
git add app/pages/ && git commit -m "feat: redesign scene and prop cards with thumbnail row"
```

---

### Task 17: 场景详情页

**Files:**
- Create: `app/pages/projects/[id]/scenes/[sid].vue`

- [ ] **Step 1: 创建详情页**

与角色详情页对称布局：
- 场景基本信息
- 参考图区
- 变体管理区
- 关联分镜区

- [ ] **Step 2: 提交**

```bash
git add app/pages/ && git commit -m "feat: add scene detail page with variant management"
```

---

### Task 18: 道具详情页

**Files:**
- Create: `app/pages/projects/[id]/props/[propId].vue`

- [ ] **Step 1: 创建详情页**

与场景详情页布局完全一致：
- 道具基本信息
- 参考图区
- 变体管理区
- 关联分镜区

- [ ] **Step 2: 提交**

```bash
git add app/pages/ && git commit -m "feat: add prop detail page with variant management"
```

---

## Chunk 6: 前端分镜改造

### Task 19: 分镜卡片改造

**Files:**
- Modify: `app/components/project/StoryboardCard.vue`
- Modify: `app/pages/projects/[id]/episodes/[num]/storyboards.vue`

- [ ] **Step 1: 改造 StoryboardCard**

新布局：
- Badge 行（序号、镜头类型、运动、转场）
- 选中关键帧横排（每个 slot 的 cover image）
- 选中视频缩略图（有视频时）
- 关联实体信息（角色形象、场景变体、道具变体）
- 描述和台词
- 操作栏（评论、编辑、详情、删除）

新增 props：`characterLooks`, `sceneVariant`, `propVariants`

- [ ] **Step 2: 修改 storyboards.vue 传递关联数据**

从 API 响应中提取关联数据传给 StoryboardCard。

- [ ] **Step 3: 添加「详情」按钮**

操作栏增加详情按钮，跳转分镜详情页。

- [ ] **Step 4: 提交**

```bash
git add app/components/ app/pages/ && git commit -m "feat: redesign storyboard cards with association info and detail navigation"
```

---

### Task 20: 分镜编辑 Sheet 改造

**Files:**
- Modify: `app/components/project/StoryboardFormDialog.vue`

- [ ] **Step 1: 添加场景变体级联选择**

先选场景（下拉），选择后动态加载该场景的变体列表，再选变体。
存为 `scene_variant_id`。

- [ ] **Step 2: 添加角色形象多选**

加载所有角色，每个角色下面显示形象列表，可多选。
存为 `character_look_ids`。

- [ ] **Step 3: 添加道具变体多选**

加载所有道具，每个道具下面显示变体列表，可多选。
存为 `prop_variant_ids`。

- [ ] **Step 4: 去掉 Sheet 中的图片/视频管理**

这些功能移到详情页。

- [ ] **Step 5: 提交**

```bash
git add app/components/ && git commit -m "feat: update StoryboardFormDialog with association selectors"
```

---

### Task 21: 分镜详情页

**Files:**
- Create: `app/pages/projects/[id]/episodes/[num]/storyboards/[sbid].vue`

- [ ] **Step 1: 创建详情页**

布局参照 spec：
- 顶部导航（返回 + 上一个/下一个分镜）
- 分镜基本信息
- 关键帧 slot 管理区（动态添加/删除 slot，每个 slot 用 EntityImageGallery）
- 视频管理区（候选视频列表 + 上传）
- 关联实体编辑区（场景变体 + 角色形象 + 道具变体）
- 分镜评论区（CommonCommentThread）

- [ ] **Step 2: 实现 slot 管理**

- 按 `metadata.slot` 分组显示 assets
- "添加关键帧"：使用 `max(slot) + 1`
- 每个 slot 一个独立的 EntityImageGallery 实例

- [ ] **Step 3: 提交**

```bash
git add app/pages/ && git commit -m "feat: add storyboard detail page with slot management and associations"
```

---

## Chunk 7: 收尾工作

### Task 22: SKILL.md 更新

**Files:**
- Modify: `skills/SKILL.md`

- [ ] **Step 1: 更新 SKILL.md**

更新命令说明，增加道具变体工具和分镜关联用法。

- [ ] **Step 2: 提交**

```bash
git add skills/ && git commit -m "docs: update SKILL.md with prop variants and storyboard associations"
```

---

### Task 23: 构建验证 + 单元测试

- [ ] **Step 1: 运行完整单元测试**

```bash
pnpm test --run
```

Expected: 所有测试通过

- [ ] **Step 2: 运行构建**

```bash
pnpm build
```

Expected: 构建成功

- [ ] **Step 3: 修复任何错误**

- [ ] **Step 4: 提交**

---

### Task 24: 本地浏览器完整功能测试

- [ ] **Step 1: 启动开发服务器并测试角色流程**

- 创建角色 → 确认自动创建基础形象
- 进入角色详情页 → 上传参考图
- 创建新形象 → 上传候选图 → 评论 → 选取
- 确认 EntityThumbnailRow 正确显示

- [ ] **Step 2: 测试场景流程**

- 创建场景 → 进入详情页
- 上传参考图
- 创建变体 → 管理候选图

- [ ] **Step 3: 测试道具流程**

- 创建道具 → 进入详情页
- 创建变体 → 管理候选图

- [ ] **Step 4: 测试分镜流程**

- 创建分镜 → 关联角色形象 + 场景变体 + 道具变体
- 进入分镜详情页
- 添加关键帧 slot → 上传候选图 → 选取
- 上传候选视频 → 选取
- 确认卡片正确显示关联信息和选中图

- [ ] **Step 5: 测试评论系统**

- 在候选图上发表评论 → 确认评论数角标更新
- 确认原有实体级评论按钮已去掉

---

### Task 25: Docker 部署 + 线上测试

- [ ] **Step 1: 构建 Docker 镜像**

```bash
docker build -t drama-studio .
```

- [ ] **Step 2: 运行 Docker 容器**

- [ ] **Step 3: 在 Docker 环境中执行完整功能测试**

重复 Task 24 的测试步骤，在 Docker 部署的环境中执行。
特别验证：
- 文件上传和预览正常
- 数据库迁移正确
- 所有 API 端点响应正常

- [ ] **Step 4: 提交最终状态**

---
