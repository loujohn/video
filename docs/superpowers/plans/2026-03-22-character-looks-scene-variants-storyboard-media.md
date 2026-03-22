# 角色形象 + 场景变体 + 分镜媒体 + 文件服务修复 实现计划

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 引入角色形象（character_looks）和场景变体（scene_variants）概念，增强分镜的图片 slot 和视频支持，修复线上 Docker 环境无法预览上传文件的问题。

**Architecture:** 新增 character_looks 和 scene_variants 两张表，复用现有 assets 表存储候选图片/视频。前端页面从直接挂载 EntityImageGallery 改为通过形象/变体中间层管理。新增 Nitro 服务端路由解决生产环境文件服务问题。

**Tech Stack:** Nuxt 3, Knex (PostgreSQL), Vue 3, shadcn-vue, MCP SDK

---

## Chunk 1: 数据层 + 文件服务修复

### Task 1: 数据库迁移 — 新建 character_looks 和 scene_variants 表

**Files:**
- Create: `migrations/20260322000000_character_looks_scene_variants.ts`

- [ ] **Step 1: 创建迁移文件**

```typescript
// migrations/20260322000000_character_looks_scene_variants.ts
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('character_looks', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('character_id').references('id').inTable('characters').onDelete('CASCADE').notNullable()
    t.string('name').notNullable()
    t.text('description')
    t.text('image_prompt')
    t.boolean('is_base').defaultTo(false)
    t.integer('sort_order').defaultTo(0)
    t.boolean('is_active').defaultTo(true)
    t.timestamps(true, true)
  })

  await knex.schema.createTable('scene_variants', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('scene_id').references('id').inTable('scenes').onDelete('CASCADE').notNullable()
    t.string('name').notNullable()
    t.text('description')
    t.text('image_prompt')
    t.string('variant_type')
    t.integer('sort_order').defaultTo(0)
    t.boolean('is_active').defaultTo(true)
    t.timestamps(true, true)
  })

  await knex.schema.raw('CREATE INDEX idx_character_looks_character ON character_looks(character_id)')
  await knex.schema.raw('CREATE INDEX idx_scene_variants_scene ON scene_variants(scene_id)')
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('scene_variants')
  await knex.schema.dropTableIfExists('character_looks')
}
```

- [ ] **Step 2: 运行迁移**

Run: `cd /Users/loujohn/project/video && npx knex migrate:latest --knexfile knexfile.ts`
Expected: Migration runs successfully

- [ ] **Step 3: Commit**

```bash
git add migrations/20260322000000_character_looks_scene_variants.ts
git commit -m "feat: add character_looks and scene_variants tables"
```

---

### Task 2: TypeScript 类型定义

**Files:**
- Create: `app/core/types/character-look.ts`
- Create: `app/core/types/scene-variant.ts`
- Modify: `app/core/types/index.ts`

- [ ] **Step 1: 创建 CharacterLook 类型**

```typescript
// app/core/types/character-look.ts
export interface CharacterLook {
  id: string
  character_id: string
  name: string
  description: string | null
  image_prompt: string | null
  is_base: boolean
  sort_order: number
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface CreateCharacterLookInput {
  name: string
  description?: string
  image_prompt?: string
  is_base?: boolean
  sort_order?: number
}
```

- [ ] **Step 2: 创建 SceneVariant 类型**

```typescript
// app/core/types/scene-variant.ts
export interface SceneVariant {
  id: string
  scene_id: string
  name: string
  description: string | null
  image_prompt: string | null
  variant_type: string | null
  sort_order: number
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface CreateSceneVariantInput {
  name: string
  description?: string
  image_prompt?: string
  variant_type?: string
  sort_order?: number
}
```

- [ ] **Step 3: 更新 index.ts 导出**

在 `app/core/types/index.ts` 末尾添加：

```typescript
export * from './character-look'
export * from './scene-variant'
```

- [ ] **Step 4: Commit**

```bash
git add app/core/types/character-look.ts app/core/types/scene-variant.ts app/core/types/index.ts
git commit -m "feat: add CharacterLook and SceneVariant type definitions"
```

---

### Task 3: Model 层

**Files:**
- Create: `app/core/models/character-look.model.ts`
- Create: `app/core/models/scene-variant.model.ts`

- [ ] **Step 1: 创建 CharacterLookModel**

```typescript
// app/core/models/character-look.model.ts
import { getDb, buildUpdateData } from '../db'
import type { CharacterLook, CreateCharacterLookInput } from '../types'

const TABLE = 'character_looks'

export const CharacterLookModel = {
  async findById(id: string): Promise<CharacterLook | undefined> {
    return getDb()(TABLE).where({ id }).first()
  },

  async findByCharacter(characterId: string): Promise<CharacterLook[]> {
    return getDb()(TABLE)
      .where({ character_id: characterId })
      .orderBy('sort_order', 'asc')
  },

  async create(characterId: string, input: CreateCharacterLookInput): Promise<CharacterLook> {
    const maxOrder = await getDb()(TABLE)
      .where({ character_id: characterId })
      .max('sort_order as max')
      .first()
    const [row] = await getDb()(TABLE)
      .insert({
        character_id: characterId,
        name: input.name,
        description: input.description ?? null,
        image_prompt: input.image_prompt ?? null,
        is_base: input.is_base ?? false,
        sort_order: input.sort_order ?? ((maxOrder?.max || 0) + 1),
      })
      .returning('*')
    return row
  },

  async update(id: string, data: Partial<CreateCharacterLookInput> & { is_active?: boolean }): Promise<CharacterLook | undefined> {
    const fields = ['name', 'description', 'image_prompt', 'is_base', 'sort_order', 'is_active'] as const
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

- [ ] **Step 2: 创建 SceneVariantModel**

```typescript
// app/core/models/scene-variant.model.ts
import { getDb, buildUpdateData } from '../db'
import type { SceneVariant, CreateSceneVariantInput } from '../types'

const TABLE = 'scene_variants'

export const SceneVariantModel = {
  async findById(id: string): Promise<SceneVariant | undefined> {
    return getDb()(TABLE).where({ id }).first()
  },

  async findByScene(sceneId: string): Promise<SceneVariant[]> {
    return getDb()(TABLE)
      .where({ scene_id: sceneId })
      .orderBy('sort_order', 'asc')
  },

  async create(sceneId: string, input: CreateSceneVariantInput): Promise<SceneVariant> {
    const maxOrder = await getDb()(TABLE)
      .where({ scene_id: sceneId })
      .max('sort_order as max')
      .first()
    const [row] = await getDb()(TABLE)
      .insert({
        scene_id: sceneId,
        name: input.name,
        description: input.description ?? null,
        image_prompt: input.image_prompt ?? null,
        variant_type: input.variant_type ?? null,
        sort_order: input.sort_order ?? ((maxOrder?.max || 0) + 1),
      })
      .returning('*')
    return row
  },

  async update(id: string, data: Partial<CreateSceneVariantInput> & { is_active?: boolean }): Promise<SceneVariant | undefined> {
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

- [ ] **Step 3: Commit**

```bash
git add app/core/models/character-look.model.ts app/core/models/scene-variant.model.ts
git commit -m "feat: add CharacterLook and SceneVariant models"
```

---

### Task 4: Service 层

**Files:**
- Create: `app/core/services/character-look.service.ts`
- Create: `app/core/services/scene-variant.service.ts`

- [ ] **Step 1: 创建 CharacterLookService**

```typescript
// app/core/services/character-look.service.ts
import { CharacterLookModel } from '../models/character-look.model'
import { CharacterService } from './character.service'
import { notFoundError } from '../errors'
import type { CharacterLook, CreateCharacterLookInput } from '../types'

export const CharacterLookService = {
  async list(projectId: string, characterId: string, userId: string): Promise<CharacterLook[]> {
    await CharacterService.get(projectId, characterId, userId)
    return CharacterLookModel.findByCharacter(characterId)
  },

  async get(projectId: string, characterId: string, lookId: string, userId: string): Promise<CharacterLook> {
    await CharacterService.get(projectId, characterId, userId)
    const look = await CharacterLookModel.findById(lookId)
    if (!look || look.character_id !== characterId) notFoundError('角色形象不存在')
    return look
  },

  async create(projectId: string, characterId: string, input: CreateCharacterLookInput, userId: string): Promise<CharacterLook> {
    await CharacterService.get(projectId, characterId, userId)
    return CharacterLookModel.create(characterId, input)
  },

  async createBaseLook(characterId: string, imagePrompt?: string | null): Promise<CharacterLook> {
    return CharacterLookModel.create(characterId, {
      name: '基础形象',
      image_prompt: imagePrompt ?? undefined,
      is_base: true,
      sort_order: 0,
    })
  },

  async update(projectId: string, characterId: string, lookId: string, data: Partial<CreateCharacterLookInput> & { is_active?: boolean }, userId: string): Promise<CharacterLook> {
    await CharacterService.get(projectId, characterId, userId)
    const look = await CharacterLookModel.findById(lookId)
    if (!look || look.character_id !== characterId) notFoundError('角色形象不存在')
    const updated = await CharacterLookModel.update(lookId, data)
    if (!updated) notFoundError('更新失败')
    return updated
  },

  async delete(projectId: string, characterId: string, lookId: string, userId: string): Promise<void> {
    await CharacterService.get(projectId, characterId, userId)
    const look = await CharacterLookModel.findById(lookId)
    if (!look || look.character_id !== characterId) notFoundError('角色形象不存在')
    await CharacterLookModel.delete(lookId)
  },
}
```

- [ ] **Step 2: 创建 SceneVariantService**

```typescript
// app/core/services/scene-variant.service.ts
import { SceneVariantModel } from '../models/scene-variant.model'
import { SceneService } from './scene.service'
import { notFoundError } from '../errors'
import type { SceneVariant, CreateSceneVariantInput } from '../types'

export const SceneVariantService = {
  async list(projectId: string, sceneId: string, userId: string): Promise<SceneVariant[]> {
    await SceneService.get(projectId, sceneId, userId)
    return SceneVariantModel.findByScene(sceneId)
  },

  async get(projectId: string, sceneId: string, variantId: string, userId: string): Promise<SceneVariant> {
    await SceneService.get(projectId, sceneId, userId)
    const variant = await SceneVariantModel.findById(variantId)
    if (!variant || variant.scene_id !== sceneId) notFoundError('场景变体不存在')
    return variant
  },

  async create(projectId: string, sceneId: string, input: CreateSceneVariantInput, userId: string): Promise<SceneVariant> {
    await SceneService.get(projectId, sceneId, userId)
    return SceneVariantModel.create(sceneId, input)
  },

  async update(projectId: string, sceneId: string, variantId: string, data: Partial<CreateSceneVariantInput> & { is_active?: boolean }, userId: string): Promise<SceneVariant> {
    await SceneService.get(projectId, sceneId, userId)
    const variant = await SceneVariantModel.findById(variantId)
    if (!variant || variant.scene_id !== sceneId) notFoundError('场景变体不存在')
    const updated = await SceneVariantModel.update(variantId, data)
    if (!updated) notFoundError('更新失败')
    return updated
  },

  async delete(projectId: string, sceneId: string, variantId: string, userId: string): Promise<void> {
    await SceneService.get(projectId, sceneId, userId)
    const variant = await SceneVariantModel.findById(variantId)
    if (!variant || variant.scene_id !== sceneId) notFoundError('场景变体不存在')
    await SceneVariantModel.delete(variantId)
  },
}
```

- [ ] **Step 3: 修改 CharacterService.create 自动创建基础形象**

在 `app/core/services/character.service.ts` 的 `create` 方法中，创建角色后自动创建基础形象：

```typescript
// 在 create 方法末尾，return 之前添加：
import { CharacterLookService } from './character-look.service'

// create 方法改为：
async create(projectId: string, input: CreateCharacterInput, userId: string): Promise<Character> {
  await ProjectService.getProject(projectId, userId)
  const character = await CharacterModel.create(projectId, input)
  await CharacterLookService.createBaseLook(character.id, input.image_prompt)
  return character
},
```

- [ ] **Step 4: Commit**

```bash
git add app/core/services/character-look.service.ts app/core/services/scene-variant.service.ts app/core/services/character.service.ts
git commit -m "feat: add CharacterLook and SceneVariant services with auto base look creation"
```

---

### Task 5: 请求校验 Schema

**Files:**
- Create: `server/schemas/character-look.ts`
- Create: `server/schemas/scene-variant.ts`

- [ ] **Step 1: 创建 character-look schema**

```typescript
// server/schemas/character-look.ts
import { z } from 'zod/v4'

export const createCharacterLookSchema = z.object({
  name: z.string().min(1, '形象名称必填').max(100),
  description: z.string().max(2000).optional(),
  image_prompt: z.string().max(5000).optional(),
  is_base: z.boolean().optional(),
  sort_order: z.number().int().optional(),
})

export const updateCharacterLookSchema = createCharacterLookSchema.partial().extend({
  is_active: z.boolean().optional(),
})
```

- [ ] **Step 2: 创建 scene-variant schema**

```typescript
// server/schemas/scene-variant.ts
import { z } from 'zod/v4'

export const createSceneVariantSchema = z.object({
  name: z.string().min(1, '变体名称必填').max(100),
  description: z.string().max(2000).optional(),
  image_prompt: z.string().max(5000).optional(),
  variant_type: z.enum(['time_of_day', 'weather', 'angle', 'custom']).optional(),
  sort_order: z.number().int().optional(),
})

export const updateSceneVariantSchema = createSceneVariantSchema.partial().extend({
  is_active: z.boolean().optional(),
})
```

- [ ] **Step 3: Commit**

```bash
git add server/schemas/character-look.ts server/schemas/scene-variant.ts
git commit -m "feat: add validation schemas for character looks and scene variants"
```

---

### Task 6: API 路由 — 角色形象 CRUD

**Files:**
- Create: `server/api/projects/[id]/characters/[cid]/looks/index.get.ts`
- Create: `server/api/projects/[id]/characters/[cid]/looks/index.post.ts`
- Create: `server/api/projects/[id]/characters/[cid]/looks/[lid].put.ts`
- Create: `server/api/projects/[id]/characters/[cid]/looks/[lid].delete.ts`

- [ ] **Step 1: GET — 列出角色形象**

```typescript
// server/api/projects/[id]/characters/[cid]/looks/index.get.ts
import { CharacterLookService } from '~/core/services/character-look.service'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const characterId = getRouterParam(event, 'cid')!
  return ok(await CharacterLookService.list(projectId, characterId, userId))
})
```

- [ ] **Step 2: POST — 创建角色形象**

```typescript
// server/api/projects/[id]/characters/[cid]/looks/index.post.ts
import { CharacterLookService } from '~/core/services/character-look.service'
import { createCharacterLookSchema } from '~~/server/schemas/character-look'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const characterId = getRouterParam(event, 'cid')!
  const body = await validateBody(event, createCharacterLookSchema)
  return ok(await CharacterLookService.create(projectId, characterId, body, userId))
})
```

- [ ] **Step 3: PUT — 更新角色形象**

```typescript
// server/api/projects/[id]/characters/[cid]/looks/[lid].put.ts
import { CharacterLookService } from '~/core/services/character-look.service'
import { updateCharacterLookSchema } from '~~/server/schemas/character-look'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const characterId = getRouterParam(event, 'cid')!
  const lookId = getRouterParam(event, 'lid')!
  const body = await validateBody(event, updateCharacterLookSchema)
  return ok(await CharacterLookService.update(projectId, characterId, lookId, body, userId))
})
```

- [ ] **Step 4: DELETE — 删除角色形象**

```typescript
// server/api/projects/[id]/characters/[cid]/looks/[lid].delete.ts
import { CharacterLookService } from '~/core/services/character-look.service'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const characterId = getRouterParam(event, 'cid')!
  const lookId = getRouterParam(event, 'lid')!
  await CharacterLookService.delete(projectId, characterId, lookId, userId)
  return ok({ deleted: true })
})
```

- [ ] **Step 5: Commit**

```bash
git add server/api/projects/\[id\]/characters/\[cid\]/looks/
git commit -m "feat: add character looks CRUD API routes"
```

---

### Task 7: API 路由 — 场景变体 CRUD

**Files:**
- Create: `server/api/projects/[id]/scenes/[sid]/variants/index.get.ts`
- Create: `server/api/projects/[id]/scenes/[sid]/variants/index.post.ts`
- Create: `server/api/projects/[id]/scenes/[sid]/variants/[vid].put.ts`
- Create: `server/api/projects/[id]/scenes/[sid]/variants/[vid].delete.ts`

- [ ] **Step 1: GET — 列出场景变体**

```typescript
// server/api/projects/[id]/scenes/[sid]/variants/index.get.ts
import { SceneVariantService } from '~/core/services/scene-variant.service'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const sceneId = getRouterParam(event, 'sid')!
  return ok(await SceneVariantService.list(projectId, sceneId, userId))
})
```

- [ ] **Step 2: POST — 创建场景变体**

```typescript
// server/api/projects/[id]/scenes/[sid]/variants/index.post.ts
import { SceneVariantService } from '~/core/services/scene-variant.service'
import { createSceneVariantSchema } from '~~/server/schemas/scene-variant'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const sceneId = getRouterParam(event, 'sid')!
  const body = await validateBody(event, createSceneVariantSchema)
  return ok(await SceneVariantService.create(projectId, sceneId, body, userId))
})
```

- [ ] **Step 3: PUT — 更新场景变体**

```typescript
// server/api/projects/[id]/scenes/[sid]/variants/[vid].put.ts
import { SceneVariantService } from '~/core/services/scene-variant.service'
import { updateSceneVariantSchema } from '~~/server/schemas/scene-variant'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const sceneId = getRouterParam(event, 'sid')!
  const variantId = getRouterParam(event, 'vid')!
  const body = await validateBody(event, updateSceneVariantSchema)
  return ok(await SceneVariantService.update(projectId, sceneId, variantId, body, userId))
})
```

- [ ] **Step 4: DELETE — 删除场景变体**

```typescript
// server/api/projects/[id]/scenes/[sid]/variants/[vid].delete.ts
import { SceneVariantService } from '~/core/services/scene-variant.service'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const sceneId = getRouterParam(event, 'sid')!
  const variantId = getRouterParam(event, 'vid')!
  await SceneVariantService.delete(projectId, sceneId, variantId, userId)
  return ok({ deleted: true })
})
```

- [ ] **Step 5: Commit**

```bash
git add server/api/projects/\[id\]/scenes/\[sid\]/variants/
git commit -m "feat: add scene variants CRUD API routes"
```

---

### Task 8: 文件服务路由（修复线上预览）

**Files:**
- Create: `server/routes/uploads/[...path].get.ts`

- [ ] **Step 1: 创建文件服务路由**

```typescript
// server/routes/uploads/[...path].get.ts
import { join } from 'path'
import { readFile, access } from 'fs/promises'
import { lookup } from '~~/server/utils/mime'

export default defineEventHandler(async (event) => {
  const pathParam = getRouterParam(event, 'path')
  if (!pathParam) {
    throw createError({ statusCode: 400, message: 'Missing path' })
  }

  if (pathParam.includes('..')) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const storageRoot = process.env.STORAGE_LOCAL_PATH || join(process.cwd(), 'uploads')
  const filePath = join(storageRoot, pathParam)

  if (!filePath.startsWith(storageRoot)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  try {
    await access(filePath)
  } catch {
    throw createError({ statusCode: 404, message: 'File not found' })
  }

  const buffer = await readFile(filePath)
  const contentType = lookup(filePath)

  setResponseHeaders(event, {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Content-Length': String(buffer.length),
  })

  return buffer
})
```

- [ ] **Step 2: 验证路由在开发模式下工作**

Run: `curl -I http://localhost:3000/uploads/projects/ 2>/dev/null | head -5`
Expected: 应该返回 404（因为目录不是文件），而不是 Nuxt 的 HTML 页面

- [ ] **Step 3: Commit**

```bash
git add server/routes/uploads/
git commit -m "fix: add server route for serving uploaded files in production"
```

---

## Chunk 2: MCP 工具 + SKILL.md 更新

### Task 9: MCP 角色形象工具

**Files:**
- Create: `mcp/tools/character-look-tools.ts`
- Modify: `mcp/server.ts`

- [ ] **Step 1: 创建 character-look-tools.ts**

```typescript
// mcp/tools/character-look-tools.ts
import { api } from '../lib/api-client.js'

export const characterLookTools = [
  {
    name: 'list_character_looks',
    description: '列出角色的所有形象（造型）',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        character_id: { type: 'string', description: '角色 ID' },
      },
      required: ['project_id', 'character_id'],
    },
  },
  {
    name: 'create_character_look',
    description: '为角色创建新形象（造型），如日常装、战斗装等',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        character_id: { type: 'string', description: '角色 ID' },
        name: { type: 'string', description: '形象名称' },
        description: { type: 'string', description: '形象描述' },
        image_prompt: { type: 'string', description: '图片生成提示词' },
        is_base: { type: 'boolean', description: '是否基础形象' },
        sort_order: { type: 'number', description: '排序' },
      },
      required: ['project_id', 'character_id', 'name'],
    },
  },
  {
    name: 'update_character_look',
    description: '更新角色形象信息',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        character_id: { type: 'string', description: '角色 ID' },
        look_id: { type: 'string', description: '形象 ID' },
        name: { type: 'string', description: '形象名称' },
        description: { type: 'string', description: '形象描述' },
        image_prompt: { type: 'string', description: '图片生成提示词' },
        is_base: { type: 'boolean', description: '是否基础形象' },
        sort_order: { type: 'number', description: '排序' },
        is_active: { type: 'boolean', description: '是否启用' },
      },
      required: ['project_id', 'character_id', 'look_id'],
    },
  },
  {
    name: 'delete_character_look',
    description: '删除角色形象',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        character_id: { type: 'string', description: '角色 ID' },
        look_id: { type: 'string', description: '形象 ID' },
      },
      required: ['project_id', 'character_id', 'look_id'],
    },
  },
]

export async function handleCharacterLookTool(name: string, args: Record<string, unknown>): Promise<string> {
  const pid = args.project_id as string
  const cid = args.character_id as string
  switch (name) {
    case 'list_character_looks':
      return JSON.stringify(await api.get(`/api/projects/${pid}/characters/${cid}/looks`), null, 2)
    case 'create_character_look': {
      const { project_id, character_id, ...data } = args
      return JSON.stringify(await api.post(`/api/projects/${pid}/characters/${cid}/looks`, data), null, 2)
    }
    case 'update_character_look': {
      const { project_id, character_id, look_id, ...data } = args
      return JSON.stringify(await api.put(`/api/projects/${pid}/characters/${cid}/looks/${look_id}`, data), null, 2)
    }
    case 'delete_character_look': {
      const lid = args.look_id as string
      return JSON.stringify(await api.delete(`/api/projects/${pid}/characters/${cid}/looks/${lid}`), null, 2)
    }
    default:
      throw new Error(`Unknown character-look tool: ${name}`)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add mcp/tools/character-look-tools.ts
git commit -m "feat: add MCP character look tools"
```

---

### Task 10: MCP 场景变体工具

**Files:**
- Create: `mcp/tools/scene-variant-tools.ts`

- [ ] **Step 1: 创建 scene-variant-tools.ts**

```typescript
// mcp/tools/scene-variant-tools.ts
import { api } from '../lib/api-client.js'

export const sceneVariantTools = [
  {
    name: 'list_scene_variants',
    description: '列出场景的所有变体（时间/天气/角度等）',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        scene_id: { type: 'string', description: '场景 ID' },
      },
      required: ['project_id', 'scene_id'],
    },
  },
  {
    name: 'create_scene_variant',
    description: '为场景创建新变体，如不同时间/天气/角度',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        scene_id: { type: 'string', description: '场景 ID' },
        name: { type: 'string', description: '变体名称' },
        description: { type: 'string', description: '变体描述' },
        image_prompt: { type: 'string', description: '图片生成提示词' },
        variant_type: { type: 'string', enum: ['time_of_day', 'weather', 'angle', 'custom'], description: '变体类型' },
        sort_order: { type: 'number', description: '排序' },
      },
      required: ['project_id', 'scene_id', 'name'],
    },
  },
  {
    name: 'update_scene_variant',
    description: '更新场景变体信息',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        scene_id: { type: 'string', description: '场景 ID' },
        variant_id: { type: 'string', description: '变体 ID' },
        name: { type: 'string', description: '变体名称' },
        description: { type: 'string', description: '变体描述' },
        image_prompt: { type: 'string', description: '图片生成提示词' },
        variant_type: { type: 'string', enum: ['time_of_day', 'weather', 'angle', 'custom'], description: '变体类型' },
        sort_order: { type: 'number', description: '排序' },
        is_active: { type: 'boolean', description: '是否启用' },
      },
      required: ['project_id', 'scene_id', 'variant_id'],
    },
  },
  {
    name: 'delete_scene_variant',
    description: '删除场景变体',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        scene_id: { type: 'string', description: '场景 ID' },
        variant_id: { type: 'string', description: '变体 ID' },
      },
      required: ['project_id', 'scene_id', 'variant_id'],
    },
  },
]

export async function handleSceneVariantTool(name: string, args: Record<string, unknown>): Promise<string> {
  const pid = args.project_id as string
  const sid = args.scene_id as string
  switch (name) {
    case 'list_scene_variants':
      return JSON.stringify(await api.get(`/api/projects/${pid}/scenes/${sid}/variants`), null, 2)
    case 'create_scene_variant': {
      const { project_id, scene_id, ...data } = args
      return JSON.stringify(await api.post(`/api/projects/${pid}/scenes/${sid}/variants`, data), null, 2)
    }
    case 'update_scene_variant': {
      const { project_id, scene_id, variant_id, ...data } = args
      return JSON.stringify(await api.put(`/api/projects/${pid}/scenes/${sid}/variants/${variant_id}`, data), null, 2)
    }
    case 'delete_scene_variant': {
      const vid = args.variant_id as string
      return JSON.stringify(await api.delete(`/api/projects/${pid}/scenes/${sid}/variants/${vid}`), null, 2)
    }
    default:
      throw new Error(`Unknown scene-variant tool: ${name}`)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add mcp/tools/scene-variant-tools.ts
git commit -m "feat: add MCP scene variant tools"
```

---

### Task 11: 注册 MCP 工具到 server.ts

**Files:**
- Modify: `mcp/server.ts`

- [ ] **Step 1: 在 mcp/server.ts 中注册新工具**

在 import 区域添加：

```typescript
import { characterLookTools, handleCharacterLookTool } from './tools/character-look-tools.js'
import { sceneVariantTools, handleSceneVariantTool } from './tools/scene-variant-tools.js'
```

在 `allTools` 数组中添加：

```typescript
...characterLookTools,
...sceneVariantTools,
```

在 `toolHandlers` 注册区域添加：

```typescript
for (const t of characterLookTools) toolHandlers[t.name] = handleCharacterLookTool
for (const t of sceneVariantTools) toolHandlers[t.name] = handleSceneVariantTool
```

- [ ] **Step 2: Commit**

```bash
git add mcp/server.ts
git commit -m "feat: register character look and scene variant tools in MCP server"
```

---

### Task 12: 更新 SKILL.md

**Files:**
- Modify: `skills/SKILL.md`

- [ ] **Step 1: 更新 /角色开发 命令**

在 SKILL.md 的 `/角色开发` 部分，更新 Process 步骤，在创建角色后增加形象管理步骤：

```
5. 为每个角色管理形象：调用 `list_character_looks` 查看已有形象，`create_character_look` 创建新形象（如日常装、战斗装等），`update_character_look` 更新形象提示词
```

- [ ] **Step 2: 更新命令总览表**

在 `/角色开发` 行的「主要 MCP 工具」列添加：`list_character_looks, create_character_look, update_character_look, delete_character_look`

- [ ] **Step 3: 更新 /分镜 N 命令**

在 `/分镜 N` 的 Process 步骤中增加视频相关说明。

- [ ] **Step 4: 新增辅助命令表**

在「辅助命令」区域新增：

```markdown
### 角色形象管理

| 工具 | 功能 |
|------|------|
| `list_character_looks` | 列出角色所有形象 |
| `create_character_look` | 创建角色形象 |
| `update_character_look` | 更新角色形象 |
| `delete_character_look` | 删除角色形象 |

### 场景变体管理

| 工具 | 功能 |
|------|------|
| `list_scene_variants` | 列出场景所有变体 |
| `create_scene_variant` | 创建场景变体 |
| `update_scene_variant` | 更新场景变体 |
| `delete_scene_variant` | 删除场景变体 |
```

- [ ] **Step 5: Commit**

```bash
git add skills/SKILL.md
git commit -m "docs: update SKILL.md with character look and scene variant tools"
```

---

## Chunk 3: 前端页面 — 角色形象管理

### Task 13: EntityImageGallery 组件增强（支持视频 + slot + generation_prompt）

**Files:**
- Modify: `app/components/project/EntityImageGallery.vue`

- [ ] **Step 1: 扩展 props 和类型**

添加新 props：
- `mediaType?: 'image' | 'video' | 'all'`（默认 'image'）
- `showSlots?: boolean`（默认 false）
- `slotCount?: number`（默认 1）

- [ ] **Step 2: 修改 assetsUrl 计算属性**

根据 `mediaType` 过滤 type 参数：
- `'image'` → `&type=image`
- `'video'` → `&type=video`
- `'all'` → 不加 type 过滤

- [ ] **Step 3: 添加视频预览支持**

在模板中，根据 asset 的 type 决定渲染 `<img>` 还是 `<video>`：
- `type === 'video'` → `<video>` 标签，带 controls
- `type === 'image'` → `<img>` 标签（现有逻辑）

- [ ] **Step 4: 添加 slot 分组视图**

当 `showSlots` 为 true 时，按 `metadata.slot` 分组显示图片，每个 slot 独立显示候选图和选中图。

- [ ] **Step 5: 修改上传逻辑支持视频**

根据 `mediaType` 调整 `accept` 属性和文件过滤逻辑：
- `'image'` → `accept="image/*"`
- `'video'` → `accept="video/*"`
- `'all'` → `accept="image/*,video/*"`

- [ ] **Step 6: 添加 generation_prompt 显示**

在每个候选项的 hover 操作区域或下方，显示 `metadata.generation_prompt`（可折叠）。

- [ ] **Step 7: Commit**

```bash
git add app/components/project/EntityImageGallery.vue
git commit -m "feat: enhance EntityImageGallery with video, slot, and generation_prompt support"
```

---

### Task 14: 角色页面集成形象管理

**Files:**
- Modify: `app/pages/projects/[id]/characters.vue`

- [ ] **Step 1: 添加形象数据获取**

为每个角色获取形象列表。使用 `useAsyncData` 或在角色列表加载后批量获取。

- [ ] **Step 2: 修改角色卡片**

将现有的 `<ProjectEntityImageGallery>` 替换为形象列表展示：
- 显示基础形象的选中图作为角色头像
- 显示形象数量标签
- 点击展开形象列表

- [ ] **Step 3: 添加形象展开区域**

每个角色卡片可展开显示形象列表：
- 每个形象显示名称、选中图缩略图
- 点击形象可展开其 EntityImageGallery
- 「添加形象」按钮

- [ ] **Step 4: 修改编辑表单**

在角色编辑 Sheet 中：
- 保留角色基本信息编辑
- 添加「形象管理」区域，列出所有形象
- 每个形象可编辑名称、描述、提示词
- 每个形象下嵌入 EntityImageGallery（entity_type='character_look'）

- [ ] **Step 5: Commit**

```bash
git add app/pages/projects/\[id\]/characters.vue
git commit -m "feat: integrate character looks management into characters page"
```

---

### Task 15: 场景页面集成变体管理

**Files:**
- Modify: `app/pages/projects/[id]/scenes.vue`

- [ ] **Step 1: 读取当前 scenes.vue 完整内容**

先读取文件了解现有结构。

- [ ] **Step 2: 添加变体数据获取**

为每个场景获取变体列表。

- [ ] **Step 3: 修改场景卡片**

将现有的 `<ProjectEntityImageGallery>` 替换为变体列表展示：
- 显示变体数量
- 每个变体显示名称、类型标签、选中图缩略图

- [ ] **Step 4: 添加变体管理**

场景编辑 Sheet 中：
- 保留场景基本信息编辑
- 添加「变体管理」区域
- 每个变体可编辑名称、描述、类型、提示词
- 每个变体下嵌入 EntityImageGallery（entity_type='scene_variant'）

- [ ] **Step 5: Commit**

```bash
git add app/pages/projects/\[id\]/scenes.vue
git commit -m "feat: integrate scene variants management into scenes page"
```

---

## Chunk 4: 前端页面 — 分镜媒体增强

### Task 16: 分镜卡片显示选中图片和视频

**Files:**
- Modify: `app/components/project/StoryboardCard.vue`

- [ ] **Step 1: 读取当前 StoryboardCard.vue**

先读取文件了解现有结构。

- [ ] **Step 2: 添加视频区域**

在卡片中添加视频展示区域：
- 显示选中的视频（如果有）
- 视频播放器（`<video>` 标签）

- [ ] **Step 3: 修改图片区域支持 slot**

如果分镜有多个 slot，按 slot 分组显示选中图片。

- [ ] **Step 4: Commit**

```bash
git add app/components/project/StoryboardCard.vue
git commit -m "feat: add video display and slot support to StoryboardCard"
```

---

### Task 17: 分镜表单对话框增强

**Files:**
- Modify: `app/components/project/StoryboardFormDialog.vue`

- [ ] **Step 1: 读取当前 StoryboardFormDialog.vue**

先读取文件了解现有结构。

- [ ] **Step 2: 添加图片 slot 管理**

在表单中添加图片管理区域：
- 可设置 slot 数量
- 每个 slot 嵌入 EntityImageGallery（mediaType='image'，带 slot 过滤）

- [ ] **Step 3: 添加视频管理区域**

在表单中添加视频管理区域：
- 嵌入 EntityImageGallery（mediaType='video'）

- [ ] **Step 4: Commit**

```bash
git add app/components/project/StoryboardFormDialog.vue
git commit -m "feat: add image slot and video management to StoryboardFormDialog"
```

---

### Task 18: 分镜页面传递新 props

**Files:**
- Modify: `app/pages/projects/[id]/episodes/[num]/storyboards.vue`

- [ ] **Step 1: 读取当前 storyboards.vue**

先读取文件了解现有结构。

- [ ] **Step 2: 确保 StoryboardCard 和 StoryboardFormDialog 接收新 props**

传递必要的 projectId 和其他新增 props。

- [ ] **Step 3: Commit**

```bash
git add app/pages/projects/\[id\]/episodes/\[num\]/storyboards.vue
git commit -m "feat: update storyboards page for new media management props"
```

---

### Task 19: 最终验证和构建

- [ ] **Step 1: 运行 TypeScript 类型检查**

Run: `cd /Users/loujohn/project/video && npx nuxi typecheck`

- [ ] **Step 2: 运行构建**

Run: `cd /Users/loujohn/project/video && npm run build`
Expected: Build succeeds without errors

- [ ] **Step 3: 验证开发模式下页面正常**

Run: `cd /Users/loujohn/project/video && npm run dev`
手动检查角色页面、场景页面、分镜页面

- [ ] **Step 4: 最终 Commit**

```bash
git add -A
git commit -m "chore: final adjustments for character looks, scene variants, and storyboard media"
```
