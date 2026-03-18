# Phase 2a: 核心资源管理 — 实施计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补齐所有核心资源实体的 Model + Service + API，实现项目列表、项目详情、角色管理、场景道具管理、分集管理和团队管理的完整前端页面。

**Architecture:** 延续 Phase 1 的三层架构 — `core/models/` (数据访问) → `core/services/` (业务逻辑+权限) → `server/api/` (薄包装层)。前端页面使用 Shadcn-vue + TailwindCSS，通过 `useApi` composable 调用 API。

**Tech Stack:** Nuxt 3, Vue 3, TypeScript, Knex.js, PostgreSQL, Shadcn-vue, TailwindCSS v4, Lucide icons

**Design Doc:** `docs/plans/2026-03-18-short-drama-platform-design.md`

---

## File Structure

```
core/
├── types/
│   └── creative-plan.ts               # 新建: CreativePlan 类型
├── models/
│   ├── character.model.ts              # 新建: Character + CharacterRelation 数据访问
│   ├── scene.model.ts                  # 新建: Scene 数据访问
│   ├── prop.model.ts                   # 新建: Prop 数据访问
│   ├── episode.model.ts               # 新建: Episode 数据访问
│   ├── episode-script.model.ts        # 新建: EpisodeScript 数据访问
│   ├── creative-plan.model.ts         # 新建: CreativePlan 数据访问
│   └── entity-version.model.ts        # 新建: EntityVersion 数据访问
└── services/
    ├── character.service.ts            # 新建: 角色业务逻辑
    ├── scene.service.ts                # 新建: 场景业务逻辑
    ├── prop.service.ts                 # 新建: 道具业务逻辑
    ├── episode.service.ts              # 新建: 分集+剧本业务逻辑
    ├── creative-plan.service.ts        # 新建: 创作方案业务逻辑
    └── version.service.ts             # 新建: 版本历史业务逻辑

server/api/projects/[id]/
├── characters/
│   ├── index.get.ts                    # GET  列出角色
│   ├── index.post.ts                   # POST 创建角色
│   └── [cid]/
│       ├── index.get.ts                # GET  角色详情
│       ├── index.put.ts                # PUT  更新角色
│       └── index.delete.ts             # DEL  删除角色
├── character-relations/
│   ├── index.get.ts                    # GET  列出关系
│   └── index.put.ts                    # PUT  批量设置关系
├── scenes/
│   ├── index.get.ts                    # GET  列出场景
│   ├── index.post.ts                   # POST 创建场景
│   └── [sid]/
│       ├── index.get.ts                # GET  场景详情
│       └── index.put.ts                # PUT  更新场景
├── props/
│   ├── index.get.ts                    # GET  列出道具
│   ├── index.post.ts                   # POST 创建道具
│   └── [pid]/
│       ├── index.get.ts                # GET  道具详情
│       └── index.put.ts                # PUT  更新道具
├── episodes/
│   ├── index.get.ts                    # GET  列出分集
│   ├── index.post.ts                   # POST 创建分集
│   └── [num]/
│       ├── index.get.ts                # GET  分集详情
│       ├── index.put.ts                # PUT  更新分集
│       └── scripts/
│           ├── index.get.ts            # GET  获取剧本(最新版)
│           └── index.post.ts           # POST 保存新版本剧本
├── plan/
│   ├── index.get.ts                    # GET  获取创作方案
│   └── index.put.ts                    # PUT  更新创作方案
└── versions/
    └── index.get.ts                    # GET  获取版本历史 ?entity_type=&entity_id=

server/api/teams/
└── [id]/
    └── index.delete.ts                 # DEL  删除团队(owner only)

pages/
├── projects/
│   ├── index.vue                       # 新建: 项目列表
│   └── [id]/
│       ├── index.vue                   # 新建: 项目概览(二级导航)
│       ├── characters.vue              # 新建: 角色管理
│       ├── scenes.vue                  # 新建: 场景与道具
│       └── episodes.vue                # 新建: 分集目录
└── teams/
    └── index.vue                       # 新建: 团队管理

components/
├── project/
│   ├── ProjectCard.vue                 # 新建: 项目卡片
│   ├── CreateProjectDialog.vue         # 新建: 新建项目弹窗
│   └── ProjectSubNav.vue              # 新建: 项目二级导航
└── common/
    ├── ConfirmDialog.vue               # 新建: 确认弹窗
    └── EmptyState.vue                  # 新建: 空状态占位
```

---

## Chunk 1: 类型定义 + 全部 Model

### Task 1: CreativePlan 类型定义

**Files:**
- Create: `core/types/creative-plan.ts`
- Modify: `core/types/index.ts`

- [ ] **Step 1: 创建 CreativePlan 类型**

```typescript
// core/types/creative-plan.ts
export interface CreativePlan {
  id: string
  project_id: string
  content: Record<string, unknown>
  version: number
  created_at: Date
  updated_at: Date
}

export interface UpdateCreativePlanInput {
  content: Record<string, unknown>
  change_summary?: string
}
```

- [ ] **Step 2: 导出新类型**

在 `core/types/index.ts` 添加:
```typescript
export * from './creative-plan'
```

---

### Task 2: Character Model

**Files:**
- Create: `core/models/character.model.ts`

- [ ] **Step 1: 实现 CharacterModel**

```typescript
// core/models/character.model.ts
import { getDb } from '../db'
import type { Character, CreateCharacterInput, CharacterRelation } from '../types'

const TABLE = 'characters'
const RELATIONS_TABLE = 'character_relations'

export const CharacterModel = {
  async findById(id: string): Promise<Character | undefined> {
    return getDb()(TABLE).where({ id }).first()
  },

  async findByProject(projectId: string): Promise<Character[]> {
    return getDb()(TABLE)
      .where({ project_id: projectId })
      .orderBy('sort_order', 'asc')
  },

  async create(projectId: string, input: CreateCharacterInput): Promise<Character> {
    const maxOrder = await getDb()(TABLE)
      .where({ project_id: projectId })
      .max('sort_order as max')
      .first()
    const [character] = await getDb()(TABLE)
      .insert({
        project_id: projectId,
        name: input.name,
        age: input.age ?? null,
        appearance: input.appearance ?? null,
        personality_tags: JSON.stringify(input.personality_tags || []),
        public_identity: input.public_identity ?? null,
        real_identity: input.real_identity ?? null,
        motivation: input.motivation ?? null,
        conflict_point: input.conflict_point ?? null,
        catchphrase: input.catchphrase ?? null,
        arc_description: input.arc_description ?? null,
        villain_level: input.villain_level ?? null,
        sort_order: input.sort_order ?? ((maxOrder?.max || 0) + 1),
      })
      .returning('*')
    return character
  },

  async update(id: string, data: Partial<CreateCharacterInput> & { is_active?: boolean }): Promise<Character | undefined> {
    const updateData: Record<string, unknown> = { updated_at: new Date() }
    if (data.name !== undefined) updateData.name = data.name
    if (data.age !== undefined) updateData.age = data.age
    if (data.appearance !== undefined) updateData.appearance = data.appearance
    if (data.personality_tags !== undefined) updateData.personality_tags = JSON.stringify(data.personality_tags)
    if (data.public_identity !== undefined) updateData.public_identity = data.public_identity
    if (data.real_identity !== undefined) updateData.real_identity = data.real_identity
    if (data.motivation !== undefined) updateData.motivation = data.motivation
    if (data.conflict_point !== undefined) updateData.conflict_point = data.conflict_point
    if (data.catchphrase !== undefined) updateData.catchphrase = data.catchphrase
    if (data.arc_description !== undefined) updateData.arc_description = data.arc_description
    if (data.villain_level !== undefined) updateData.villain_level = data.villain_level
    if (data.sort_order !== undefined) updateData.sort_order = data.sort_order
    if (data.is_active !== undefined) updateData.is_active = data.is_active

    const [character] = await getDb()(TABLE).where({ id }).update(updateData).returning('*')
    return character
  },

  async delete(id: string): Promise<boolean> {
    const count = await getDb()(TABLE).where({ id }).del()
    return count > 0
  },

  // --- Character Relations ---
  async getRelations(projectId: string): Promise<CharacterRelation[]> {
    return getDb()(RELATIONS_TABLE).where({ project_id: projectId })
  },

  async setRelations(projectId: string, relations: Array<{ from_character_id: string; to_character_id: string; relation_type: string; description?: string }>): Promise<CharacterRelation[]> {
    await getDb()(RELATIONS_TABLE).where({ project_id: projectId }).del()
    if (relations.length === 0) return []
    const rows = relations.map(r => ({
      project_id: projectId,
      from_character_id: r.from_character_id,
      to_character_id: r.to_character_id,
      relation_type: r.relation_type,
      description: r.description ?? null,
    }))
    return getDb()(RELATIONS_TABLE).insert(rows).returning('*')
  },
}
```

---

### Task 3: Scene Model

**Files:**
- Create: `core/models/scene.model.ts`

- [ ] **Step 1: 实现 SceneModel**

```typescript
// core/models/scene.model.ts
import { getDb } from '../db'
import type { Scene, CreateSceneInput } from '../types'

const TABLE = 'scenes'

export const SceneModel = {
  async findById(id: string): Promise<Scene | undefined> {
    return getDb()(TABLE).where({ id }).first()
  },

  async findByProject(projectId: string): Promise<Scene[]> {
    return getDb()(TABLE).where({ project_id: projectId }).orderBy('created_at', 'desc')
  },

  async create(projectId: string, input: CreateSceneInput): Promise<Scene> {
    const [scene] = await getDb()(TABLE)
      .insert({
        project_id: projectId,
        name: input.name,
        location_type: input.location_type ?? null,
        time_of_day: input.time_of_day ?? null,
        description: input.description ?? null,
        tags: JSON.stringify(input.tags || []),
      })
      .returning('*')
    return scene
  },

  async update(id: string, data: Partial<CreateSceneInput> & { is_active?: boolean }): Promise<Scene | undefined> {
    const updateData: Record<string, unknown> = { updated_at: new Date() }
    if (data.name !== undefined) updateData.name = data.name
    if (data.location_type !== undefined) updateData.location_type = data.location_type
    if (data.time_of_day !== undefined) updateData.time_of_day = data.time_of_day
    if (data.description !== undefined) updateData.description = data.description
    if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags)
    if (data.is_active !== undefined) updateData.is_active = data.is_active

    const [scene] = await getDb()(TABLE).where({ id }).update(updateData).returning('*')
    return scene
  },
}
```

---

### Task 4: Prop Model

**Files:**
- Create: `core/models/prop.model.ts`

- [ ] **Step 1: 实现 PropModel**

```typescript
// core/models/prop.model.ts
import { getDb } from '../db'
import type { Prop, CreatePropInput } from '../types'

const TABLE = 'props'

export const PropModel = {
  async findById(id: string): Promise<Prop | undefined> {
    return getDb()(TABLE).where({ id }).first()
  },

  async findByProject(projectId: string): Promise<Prop[]> {
    return getDb()(TABLE).where({ project_id: projectId }).orderBy('created_at', 'desc')
  },

  async create(projectId: string, input: CreatePropInput): Promise<Prop> {
    const [prop] = await getDb()(TABLE)
      .insert({
        project_id: projectId,
        name: input.name,
        description: input.description ?? null,
        tags: JSON.stringify(input.tags || []),
      })
      .returning('*')
    return prop
  },

  async update(id: string, data: Partial<CreatePropInput> & { is_active?: boolean }): Promise<Prop | undefined> {
    const updateData: Record<string, unknown> = { updated_at: new Date() }
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags)
    if (data.is_active !== undefined) updateData.is_active = data.is_active

    const [prop] = await getDb()(TABLE).where({ id }).update(updateData).returning('*')
    return prop
  },
}
```

---

### Task 5: Episode Model

**Files:**
- Create: `core/models/episode.model.ts`

- [ ] **Step 1: 实现 EpisodeModel**

```typescript
// core/models/episode.model.ts
import { getDb } from '../db'
import type { Episode, CreateEpisodeInput } from '../types'

const TABLE = 'episodes'

export const EpisodeModel = {
  async findById(id: string): Promise<Episode | undefined> {
    return getDb()(TABLE).where({ id }).first()
  },

  async findByProject(projectId: string): Promise<Episode[]> {
    return getDb()(TABLE)
      .where({ project_id: projectId })
      .orderBy('episode_number', 'asc')
  },

  async findByNumber(projectId: string, episodeNumber: number): Promise<Episode | undefined> {
    return getDb()(TABLE)
      .where({ project_id: projectId, episode_number: episodeNumber })
      .first()
  },

  async create(projectId: string, input: CreateEpisodeInput): Promise<Episode> {
    const [episode] = await getDb()(TABLE)
      .insert({
        project_id: projectId,
        episode_number: input.episode_number,
        title: input.title ?? null,
        synopsis: input.synopsis ?? null,
        hook_type: input.hook_type ?? null,
        is_key_episode: input.is_key_episode ?? false,
        is_paywall: input.is_paywall ?? false,
        act: input.act ?? null,
        rhythm_phase: input.rhythm_phase ?? null,
      })
      .returning('*')
    return episode
  },

  async update(id: string, data: Partial<CreateEpisodeInput> & { status?: string; is_active?: boolean }): Promise<Episode | undefined> {
    const updateData: Record<string, unknown> = { updated_at: new Date() }
    if (data.episode_number !== undefined) updateData.episode_number = data.episode_number
    if (data.title !== undefined) updateData.title = data.title
    if (data.synopsis !== undefined) updateData.synopsis = data.synopsis
    if (data.hook_type !== undefined) updateData.hook_type = data.hook_type
    if (data.is_key_episode !== undefined) updateData.is_key_episode = data.is_key_episode
    if (data.is_paywall !== undefined) updateData.is_paywall = data.is_paywall
    if (data.act !== undefined) updateData.act = data.act
    if (data.rhythm_phase !== undefined) updateData.rhythm_phase = data.rhythm_phase
    if (data.status !== undefined) updateData.status = data.status
    if (data.is_active !== undefined) updateData.is_active = data.is_active

    const [episode] = await getDb()(TABLE).where({ id }).update(updateData).returning('*')
    return episode
  },
}
```

---

### Task 6: EpisodeScript Model

**Files:**
- Create: `core/models/episode-script.model.ts`

- [ ] **Step 1: 实现 EpisodeScriptModel**

```typescript
// core/models/episode-script.model.ts
import { getDb } from '../db'
import type { EpisodeScript } from '../types'

const TABLE = 'episode_scripts'

export const EpisodeScriptModel = {
  async findLatest(episodeId: string): Promise<EpisodeScript | undefined> {
    return getDb()(TABLE)
      .where({ episode_id: episodeId })
      .orderBy('version', 'desc')
      .first()
  },

  async findAll(episodeId: string): Promise<EpisodeScript[]> {
    return getDb()(TABLE)
      .where({ episode_id: episodeId })
      .orderBy('version', 'desc')
  },

  async create(episodeId: string, content: string, userId: string): Promise<EpisodeScript> {
    const latest = await this.findLatest(episodeId)
    const nextVersion = (latest?.version || 0) + 1
    const wordCount = content.replace(/\s/g, '').length

    const [script] = await getDb()(TABLE)
      .insert({
        episode_id: episodeId,
        content,
        version: nextVersion,
        word_count: wordCount,
        created_by: userId,
      })
      .returning('*')
    return script
  },
}
```

---

### Task 7: CreativePlan Model

**Files:**
- Create: `core/models/creative-plan.model.ts`

- [ ] **Step 1: 实现 CreativePlanModel**

```typescript
// core/models/creative-plan.model.ts
import { getDb } from '../db'
import type { CreativePlan, UpdateCreativePlanInput } from '../types'

const TABLE = 'creative_plans'

export const CreativePlanModel = {
  async findByProject(projectId: string): Promise<CreativePlan | undefined> {
    return getDb()(TABLE).where({ project_id: projectId }).first()
  },

  async upsert(projectId: string, input: UpdateCreativePlanInput): Promise<CreativePlan> {
    const existing = await this.findByProject(projectId)
    if (existing) {
      const [plan] = await getDb()(TABLE)
        .where({ id: existing.id })
        .update({
          content: JSON.stringify(input.content),
          version: existing.version + 1,
          updated_at: new Date(),
        })
        .returning('*')
      return plan
    }
    const [plan] = await getDb()(TABLE)
      .insert({
        project_id: projectId,
        content: JSON.stringify(input.content),
        version: 1,
      })
      .returning('*')
    return plan
  },
}
```

---

### Task 8: EntityVersion Model

**Files:**
- Create: `core/models/entity-version.model.ts`

- [ ] **Step 1: 实现 EntityVersionModel**

```typescript
// core/models/entity-version.model.ts
import { getDb } from '../db'
import type { EntityVersion } from '../types'

const TABLE = 'entity_versions'

export const EntityVersionModel = {
  async findByEntity(entityType: string, entityId: string): Promise<EntityVersion[]> {
    return getDb()(TABLE)
      .where({ entity_type: entityType, entity_id: entityId })
      .orderBy('version_number', 'desc')
  },

  async create(
    entityType: string,
    entityId: string,
    snapshot: Record<string, unknown>,
    userId: string,
    changeSummary?: string,
  ): Promise<EntityVersion> {
    const latest = await getDb()(TABLE)
      .where({ entity_type: entityType, entity_id: entityId })
      .max('version_number as max')
      .first()
    const nextVersion = ((latest?.max as number) || 0) + 1

    const [version] = await getDb()(TABLE)
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        version_number: nextVersion,
        snapshot: JSON.stringify(snapshot),
        change_summary: changeSummary ?? null,
        created_by: userId,
      })
      .returning('*')
    return version
  },
}
```

---

## Chunk 2: 全部 Service

### Task 9: Character Service

**Files:**
- Create: `core/services/character.service.ts`

权限模型：通过 ProjectService.getProject 间接校验（该方法内部检查团队成员权限）。

- [ ] **Step 1: 实现 CharacterService**

```typescript
// core/services/character.service.ts
import { CharacterModel } from '../models/character.model'
import { ProjectService } from './project.service'
import { notFoundError } from '../errors'
import type { Character, CreateCharacterInput, CharacterRelation } from '../types'

export const CharacterService = {
  async list(projectId: string, userId: string): Promise<Character[]> {
    await ProjectService.getProject(projectId, userId)
    return CharacterModel.findByProject(projectId)
  },

  async get(projectId: string, characterId: string, userId: string): Promise<Character> {
    await ProjectService.getProject(projectId, userId)
    const character = await CharacterModel.findById(characterId)
    if (!character || character.project_id !== projectId) notFoundError('角色不存在')
    return character
  },

  async create(projectId: string, input: CreateCharacterInput, userId: string): Promise<Character> {
    await ProjectService.getProject(projectId, userId)
    return CharacterModel.create(projectId, input)
  },

  async update(projectId: string, characterId: string, data: Partial<CreateCharacterInput> & { is_active?: boolean }, userId: string): Promise<Character> {
    await ProjectService.getProject(projectId, userId)
    const character = await CharacterModel.findById(characterId)
    if (!character || character.project_id !== projectId) notFoundError('角色不存在')
    const updated = await CharacterModel.update(characterId, data)
    if (!updated) notFoundError('更新失败')
    return updated
  },

  async delete(projectId: string, characterId: string, userId: string): Promise<void> {
    await ProjectService.getProject(projectId, userId)
    const character = await CharacterModel.findById(characterId)
    if (!character || character.project_id !== projectId) notFoundError('角色不存在')
    await CharacterModel.delete(characterId)
  },

  async getRelations(projectId: string, userId: string): Promise<CharacterRelation[]> {
    await ProjectService.getProject(projectId, userId)
    return CharacterModel.getRelations(projectId)
  },

  async setRelations(projectId: string, relations: Array<{ from_character_id: string; to_character_id: string; relation_type: string; description?: string }>, userId: string): Promise<CharacterRelation[]> {
    await ProjectService.getProject(projectId, userId)
    return CharacterModel.setRelations(projectId, relations)
  },
}
```

---

### Task 10: Scene Service

**Files:**
- Create: `core/services/scene.service.ts`

- [ ] **Step 1: 实现 SceneService**

```typescript
// core/services/scene.service.ts
import { SceneModel } from '../models/scene.model'
import { ProjectService } from './project.service'
import { notFoundError } from '../errors'
import type { Scene, CreateSceneInput } from '../types'

export const SceneService = {
  async list(projectId: string, userId: string): Promise<Scene[]> {
    await ProjectService.getProject(projectId, userId)
    return SceneModel.findByProject(projectId)
  },

  async get(projectId: string, sceneId: string, userId: string): Promise<Scene> {
    await ProjectService.getProject(projectId, userId)
    const scene = await SceneModel.findById(sceneId)
    if (!scene || scene.project_id !== projectId) notFoundError('场景不存在')
    return scene
  },

  async create(projectId: string, input: CreateSceneInput, userId: string): Promise<Scene> {
    await ProjectService.getProject(projectId, userId)
    return SceneModel.create(projectId, input)
  },

  async update(projectId: string, sceneId: string, data: Partial<CreateSceneInput> & { is_active?: boolean }, userId: string): Promise<Scene> {
    await ProjectService.getProject(projectId, userId)
    const scene = await SceneModel.findById(sceneId)
    if (!scene || scene.project_id !== projectId) notFoundError('场景不存在')
    const updated = await SceneModel.update(sceneId, data)
    if (!updated) notFoundError('更新失败')
    return updated
  },
}
```

---

### Task 11: Prop Service

**Files:**
- Create: `core/services/prop.service.ts`

- [ ] **Step 1: 实现 PropService**

```typescript
// core/services/prop.service.ts
import { PropModel } from '../models/prop.model'
import { ProjectService } from './project.service'
import { notFoundError } from '../errors'
import type { Prop, CreatePropInput } from '../types'

export const PropService = {
  async list(projectId: string, userId: string): Promise<Prop[]> {
    await ProjectService.getProject(projectId, userId)
    return PropModel.findByProject(projectId)
  },

  async get(projectId: string, propId: string, userId: string): Promise<Prop> {
    await ProjectService.getProject(projectId, userId)
    const prop = await PropModel.findById(propId)
    if (!prop || prop.project_id !== projectId) notFoundError('道具不存在')
    return prop
  },

  async create(projectId: string, input: CreatePropInput, userId: string): Promise<Prop> {
    await ProjectService.getProject(projectId, userId)
    return PropModel.create(projectId, input)
  },

  async update(projectId: string, propId: string, data: Partial<CreatePropInput> & { is_active?: boolean }, userId: string): Promise<Prop> {
    await ProjectService.getProject(projectId, userId)
    const prop = await PropModel.findById(propId)
    if (!prop || prop.project_id !== projectId) notFoundError('道具不存在')
    const updated = await PropModel.update(propId, data)
    if (!updated) notFoundError('更新失败')
    return updated
  },
}
```

---

### Task 12: Episode Service

**Files:**
- Create: `core/services/episode.service.ts`

- [ ] **Step 1: 实现 EpisodeService**

```typescript
// core/services/episode.service.ts
import { EpisodeModel } from '../models/episode.model'
import { EpisodeScriptModel } from '../models/episode-script.model'
import { ProjectService } from './project.service'
import { notFoundError, badRequestError } from '../errors'
import type { Episode, EpisodeScript, CreateEpisodeInput } from '../types'

export const EpisodeService = {
  async list(projectId: string, userId: string): Promise<Episode[]> {
    await ProjectService.getProject(projectId, userId)
    return EpisodeModel.findByProject(projectId)
  },

  async getByNumber(projectId: string, episodeNumber: number, userId: string): Promise<Episode> {
    await ProjectService.getProject(projectId, userId)
    const episode = await EpisodeModel.findByNumber(projectId, episodeNumber)
    if (!episode) notFoundError('分集不存在')
    return episode
  },

  async create(projectId: string, input: CreateEpisodeInput, userId: string): Promise<Episode> {
    await ProjectService.getProject(projectId, userId)
    const existing = await EpisodeModel.findByNumber(projectId, input.episode_number)
    if (existing) badRequestError(`第 ${input.episode_number} 集已存在`)
    return EpisodeModel.create(projectId, input)
  },

  async update(projectId: string, episodeNumber: number, data: Partial<CreateEpisodeInput> & { status?: string; is_active?: boolean }, userId: string): Promise<Episode> {
    await ProjectService.getProject(projectId, userId)
    const episode = await EpisodeModel.findByNumber(projectId, episodeNumber)
    if (!episode) notFoundError('分集不存在')
    const updated = await EpisodeModel.update(episode.id, data)
    if (!updated) notFoundError('更新失败')
    return updated
  },

  // --- Scripts ---
  async getLatestScript(projectId: string, episodeNumber: number, userId: string): Promise<EpisodeScript | null> {
    await ProjectService.getProject(projectId, userId)
    const episode = await EpisodeModel.findByNumber(projectId, episodeNumber)
    if (!episode) notFoundError('分集不存在')
    const script = await EpisodeScriptModel.findLatest(episode.id)
    return script || null
  },

  async saveScript(projectId: string, episodeNumber: number, content: string, userId: string): Promise<EpisodeScript> {
    await ProjectService.getProject(projectId, userId)
    const episode = await EpisodeModel.findByNumber(projectId, episodeNumber)
    if (!episode) notFoundError('分集不存在')
    return EpisodeScriptModel.create(episode.id, content, userId)
  },
}
```

---

### Task 13: CreativePlan Service

**Files:**
- Create: `core/services/creative-plan.service.ts`

- [ ] **Step 1: 实现 CreativePlanService**

```typescript
// core/services/creative-plan.service.ts
import { CreativePlanModel } from '../models/creative-plan.model'
import { EntityVersionModel } from '../models/entity-version.model'
import { ProjectService } from './project.service'
import type { CreativePlan, UpdateCreativePlanInput } from '../types'

export const CreativePlanService = {
  async get(projectId: string, userId: string): Promise<CreativePlan | null> {
    await ProjectService.getProject(projectId, userId)
    const plan = await CreativePlanModel.findByProject(projectId)
    return plan || null
  },

  async update(projectId: string, input: UpdateCreativePlanInput, userId: string): Promise<CreativePlan> {
    await ProjectService.getProject(projectId, userId)

    const existing = await CreativePlanModel.findByProject(projectId)
    if (existing) {
      await EntityVersionModel.create(
        'creative_plan',
        existing.id,
        { content: existing.content, version: existing.version },
        userId,
        input.change_summary,
      )
    }

    return CreativePlanModel.upsert(projectId, input)
  },
}
```

---

### Task 14: Version Service

**Files:**
- Create: `core/services/version.service.ts`

- [ ] **Step 1: 实现 VersionService**

```typescript
// core/services/version.service.ts
import { EntityVersionModel } from '../models/entity-version.model'
import type { EntityVersion } from '../types'

export const VersionService = {
  async getHistory(entityType: string, entityId: string): Promise<EntityVersion[]> {
    return EntityVersionModel.findByEntity(entityType, entityId)
  },
}
```

---

## Chunk 3: API 路由 — Characters / Scenes / Props

### Task 15: Character API Routes

**Files:**
- Create: `server/api/projects/[id]/characters/index.get.ts`
- Create: `server/api/projects/[id]/characters/index.post.ts`
- Create: `server/api/projects/[id]/characters/[cid]/index.get.ts`
- Create: `server/api/projects/[id]/characters/[cid]/index.put.ts`
- Create: `server/api/projects/[id]/characters/[cid]/index.delete.ts`
- Create: `server/api/projects/[id]/character-relations/index.get.ts`
- Create: `server/api/projects/[id]/character-relations/index.put.ts`

- [ ] **Step 1: Characters List & Create**

```typescript
// server/api/projects/[id]/characters/index.get.ts
import { CharacterService } from '~/core/services/character.service'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const characters = await CharacterService.list(projectId, userId)
  return ok(characters)
})
```

```typescript
// server/api/projects/[id]/characters/index.post.ts
import { CharacterService } from '~/core/services/character.service'
import { ok, badRequest } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const body = await readBody(event)
  if (!body.name) badRequest('name 必填')
  const character = await CharacterService.create(projectId, body, userId)
  return ok(character)
})
```

- [ ] **Step 2: Character Detail, Update, Delete**

```typescript
// server/api/projects/[id]/characters/[cid]/index.get.ts
import { CharacterService } from '~/core/services/character.service'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const characterId = getRouterParam(event, 'cid')!
  const character = await CharacterService.get(projectId, characterId, userId)
  return ok(character)
})
```

```typescript
// server/api/projects/[id]/characters/[cid]/index.put.ts
import { CharacterService } from '~/core/services/character.service'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const characterId = getRouterParam(event, 'cid')!
  const body = await readBody(event)
  const character = await CharacterService.update(projectId, characterId, body, userId)
  return ok(character)
})
```

```typescript
// server/api/projects/[id]/characters/[cid]/index.delete.ts
import { CharacterService } from '~/core/services/character.service'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const characterId = getRouterParam(event, 'cid')!
  await CharacterService.delete(projectId, characterId, userId)
  return ok({ deleted: true })
})
```

- [ ] **Step 3: Character Relations**

```typescript
// server/api/projects/[id]/character-relations/index.get.ts
import { CharacterService } from '~/core/services/character.service'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const relations = await CharacterService.getRelations(projectId, userId)
  return ok(relations)
})
```

```typescript
// server/api/projects/[id]/character-relations/index.put.ts
import { CharacterService } from '~/core/services/character.service'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const relations = await CharacterService.setRelations(projectId, body.relations || [], userId)
  return ok(relations)
})
```

---

### Task 16: Scene API Routes

**Files:**
- Create: `server/api/projects/[id]/scenes/index.get.ts`
- Create: `server/api/projects/[id]/scenes/index.post.ts`
- Create: `server/api/projects/[id]/scenes/[sid]/index.get.ts`
- Create: `server/api/projects/[id]/scenes/[sid]/index.put.ts`

- [ ] **Step 1: 全部 Scene API**

```typescript
// server/api/projects/[id]/scenes/index.get.ts
import { SceneService } from '~/core/services/scene.service'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  return ok(await SceneService.list(projectId, userId))
})
```

```typescript
// server/api/projects/[id]/scenes/index.post.ts
import { SceneService } from '~/core/services/scene.service'
import { ok, badRequest } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const body = await readBody(event)
  if (!body.name) badRequest('name 必填')
  return ok(await SceneService.create(projectId, body, userId))
})
```

```typescript
// server/api/projects/[id]/scenes/[sid]/index.get.ts
import { SceneService } from '~/core/services/scene.service'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const sceneId = getRouterParam(event, 'sid')!
  return ok(await SceneService.get(projectId, sceneId, userId))
})
```

```typescript
// server/api/projects/[id]/scenes/[sid]/index.put.ts
import { SceneService } from '~/core/services/scene.service'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const sceneId = getRouterParam(event, 'sid')!
  const body = await readBody(event)
  return ok(await SceneService.update(projectId, sceneId, body, userId))
})
```

---

### Task 17: Prop API Routes

**Files:**
- Create: `server/api/projects/[id]/props/index.get.ts`
- Create: `server/api/projects/[id]/props/index.post.ts`
- Create: `server/api/projects/[id]/props/[pid]/index.get.ts`
- Create: `server/api/projects/[id]/props/[pid]/index.put.ts`

- [ ] **Step 1: 全部 Prop API**

```typescript
// server/api/projects/[id]/props/index.get.ts
import { PropService } from '~/core/services/prop.service'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  return ok(await PropService.list(projectId, userId))
})
```

```typescript
// server/api/projects/[id]/props/index.post.ts
import { PropService } from '~/core/services/prop.service'
import { ok, badRequest } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const body = await readBody(event)
  if (!body.name) badRequest('name 必填')
  return ok(await PropService.create(projectId, body, userId))
})
```

```typescript
// server/api/projects/[id]/props/[pid]/index.get.ts
import { PropService } from '~/core/services/prop.service'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const propId = getRouterParam(event, 'pid')!
  return ok(await PropService.get(projectId, propId, userId))
})
```

```typescript
// server/api/projects/[id]/props/[pid]/index.put.ts
import { PropService } from '~/core/services/prop.service'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const propId = getRouterParam(event, 'pid')!
  const body = await readBody(event)
  return ok(await PropService.update(projectId, propId, body, userId))
})
```

---

## Chunk 4: API 路由 — Episodes / Scripts / Plan / Versions

### Task 18: Episode & Script API Routes

**Files:**
- Create: `server/api/projects/[id]/episodes/index.get.ts`
- Create: `server/api/projects/[id]/episodes/index.post.ts`
- Create: `server/api/projects/[id]/episodes/[num]/index.get.ts`
- Create: `server/api/projects/[id]/episodes/[num]/index.put.ts`
- Create: `server/api/projects/[id]/episodes/[num]/scripts/index.get.ts`
- Create: `server/api/projects/[id]/episodes/[num]/scripts/index.post.ts`

- [ ] **Step 1: Episode List & Create**

```typescript
// server/api/projects/[id]/episodes/index.get.ts
import { EpisodeService } from '~/core/services/episode.service'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  return ok(await EpisodeService.list(projectId, userId))
})
```

```typescript
// server/api/projects/[id]/episodes/index.post.ts
import { EpisodeService } from '~/core/services/episode.service'
import { ok, badRequest } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const body = await readBody(event)
  if (!body.episode_number) badRequest('episode_number 必填')
  return ok(await EpisodeService.create(projectId, body, userId))
})
```

- [ ] **Step 2: Episode Detail & Update**

```typescript
// server/api/projects/[id]/episodes/[num]/index.get.ts
import { EpisodeService } from '~/core/services/episode.service'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const num = Number(getRouterParam(event, 'num'))
  return ok(await EpisodeService.getByNumber(projectId, num, userId))
})
```

```typescript
// server/api/projects/[id]/episodes/[num]/index.put.ts
import { EpisodeService } from '~/core/services/episode.service'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const num = Number(getRouterParam(event, 'num'))
  const body = await readBody(event)
  return ok(await EpisodeService.update(projectId, num, body, userId))
})
```

- [ ] **Step 3: Script API**

```typescript
// server/api/projects/[id]/episodes/[num]/scripts/index.get.ts
import { EpisodeService } from '~/core/services/episode.service'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const num = Number(getRouterParam(event, 'num'))
  const script = await EpisodeService.getLatestScript(projectId, num, userId)
  return ok(script)
})
```

```typescript
// server/api/projects/[id]/episodes/[num]/scripts/index.post.ts
import { EpisodeService } from '~/core/services/episode.service'
import { ok, badRequest } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const num = Number(getRouterParam(event, 'num'))
  const body = await readBody(event)
  if (!body.content) badRequest('content 必填')
  return ok(await EpisodeService.saveScript(projectId, num, body.content, userId))
})
```

---

### Task 19: CreativePlan API Routes

**Files:**
- Create: `server/api/projects/[id]/plan/index.get.ts`
- Create: `server/api/projects/[id]/plan/index.put.ts`

- [ ] **Step 1: Plan API**

```typescript
// server/api/projects/[id]/plan/index.get.ts
import { CreativePlanService } from '~/core/services/creative-plan.service'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  return ok(await CreativePlanService.get(projectId, userId))
})
```

```typescript
// server/api/projects/[id]/plan/index.put.ts
import { CreativePlanService } from '~/core/services/creative-plan.service'
import { ok, badRequest } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const body = await readBody(event)
  if (!body.content) badRequest('content 必填')
  return ok(await CreativePlanService.update(projectId, body, userId))
})
```

---

### Task 20: Version History API

**Files:**
- Create: `server/api/projects/[id]/versions/index.get.ts`

- [ ] **Step 1: Version API**

```typescript
// server/api/projects/[id]/versions/index.get.ts
import { VersionService } from '~/core/services/version.service'
import { ProjectService } from '~/core/services/project.service'
import { ok, badRequest } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  await ProjectService.getProject(projectId, userId)

  const query = getQuery(event)
  const entityType = query.entity_type as string
  const entityId = query.entity_id as string
  if (!entityType || !entityId) badRequest('entity_type 和 entity_id 必填')

  return ok(await VersionService.getHistory(entityType, entityId))
})
```

---

## Chunk 5: Shadcn-vue 组件 + 通用前端组件

### Task 21: 安装 Shadcn-vue 额外组件

- [ ] **Step 1: 安装所需组件**

运行:
```bash
npx shadcn-vue@latest add dialog sheet table tabs textarea select switch
```

如果 CLI 失败则手动从 shadcn-vue 仓库复制。

---

### Task 22: 通用前端组件

**Files:**
- Create: `components/common/EmptyState.vue`
- Create: `components/common/ConfirmDialog.vue`

- [ ] **Step 1: EmptyState 组件**

```vue
<!-- components/common/EmptyState.vue -->
<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  icon?: Component
  title: string
  description?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <div v-if="icon" class="h-12 w-12 rounded-xl bg-zinc-100 flex items-center justify-center mb-3">
      <component :is="icon" class="h-6 w-6 text-zinc-400" />
    </div>
    <p class="text-sm font-medium text-zinc-600">{{ title }}</p>
    <p v-if="description" class="text-xs text-zinc-400 mt-1 max-w-xs">{{ description }}</p>
    <div class="mt-4">
      <slot />
    </div>
  </div>
</template>
```

- [ ] **Step 2: ConfirmDialog 组件**

```vue
<!-- components/common/ConfirmDialog.vue -->
<script setup lang="ts">
const props = defineProps<{
  open: boolean
  title: string
  description?: string
  confirmText?: string
  destructive?: boolean
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <Dialog :open="open" @update:open="(v) => { if (!v) emit('cancel') }">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription v-if="description">{{ description }}</DialogDescription>
      </DialogHeader>
      <DialogFooter class="gap-2">
        <Button variant="outline" @click="emit('cancel')">取消</Button>
        <Button
          :variant="destructive ? 'destructive' : 'default'"
          @click="emit('confirm')"
        >
          {{ confirmText || '确认' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
```

---

### Task 23: ProjectSubNav 组件

**Files:**
- Create: `components/project/ProjectSubNav.vue`

- [ ] **Step 1: 项目二级导航**

```vue
<!-- components/project/ProjectSubNav.vue -->
<script setup lang="ts">
import { BookOpen, Users as UsersIcon, MapPin, ListOrdered, Clapperboard } from 'lucide-vue-next'

const props = defineProps<{ projectId: string }>()
const route = useRoute()

const navItems = [
  { label: '概览', icon: Clapperboard, to: `/projects/${props.projectId}` },
  { label: '角色', icon: UsersIcon, to: `/projects/${props.projectId}/characters` },
  { label: '场景与道具', icon: MapPin, to: `/projects/${props.projectId}/scenes` },
  { label: '分集', icon: ListOrdered, to: `/projects/${props.projectId}/episodes` },
]

function isActive(to: string) {
  return route.path === to
}
</script>

<template>
  <nav class="flex gap-1 border-b border-zinc-200 mb-6">
    <NuxtLink
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      :class="[
        'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
        isActive(item.to)
          ? 'border-indigo-600 text-indigo-700'
          : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300',
      ]"
    >
      <component :is="item.icon" class="h-4 w-4" />
      {{ item.label }}
    </NuxtLink>
  </nav>
</template>
```

---

### Task 24: ProjectCard 组件

**Files:**
- Create: `components/project/ProjectCard.vue`

- [ ] **Step 1: 项目卡片**

```vue
<!-- components/project/ProjectCard.vue -->
<script setup lang="ts">
import { Clapperboard } from 'lucide-vue-next'

const props = defineProps<{
  project: {
    id: string
    title: string
    genre: string[]
    status: string
    total_episodes: number
    updated_at: string
  }
}>()

const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-zinc-100 text-zinc-600' },
  in_progress: { label: '进行中', color: 'bg-indigo-50 text-indigo-700' },
  review: { label: '审核中', color: 'bg-amber-50 text-amber-700' },
  completed: { label: '已完成', color: 'bg-emerald-50 text-emerald-700' },
}
</script>

<template>
  <NuxtLink
    :to="`/projects/${project.id}`"
    class="group block bg-white rounded-2xl border border-zinc-200/60 p-5 shadow-sm hover:shadow-md hover:border-indigo-200/60 transition-all duration-200"
  >
    <div class="flex items-start gap-4">
      <div class="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center shrink-0 group-hover:from-indigo-200 group-hover:to-violet-200 transition-colors">
        <Clapperboard class="h-5 w-5 text-indigo-600" />
      </div>
      <div class="flex-1 min-w-0">
        <h3 class="text-sm font-semibold text-zinc-900 truncate group-hover:text-indigo-700 transition-colors">
          {{ project.title }}
        </h3>
        <p class="text-xs text-zinc-400 mt-0.5">
          {{ (project.genre || []).join(' · ') || '未设置类型' }} · {{ project.total_episodes }}集
        </p>
      </div>
      <Badge :class="statusMap[project.status]?.color || 'bg-zinc-100 text-zinc-600'" variant="secondary" class="text-xs shrink-0">
        {{ statusMap[project.status]?.label || project.status }}
      </Badge>
    </div>
  </NuxtLink>
</template>
```

---

### Task 25: CreateProjectDialog 组件

**Files:**
- Create: `components/project/CreateProjectDialog.vue`

- [ ] **Step 1: 新建项目弹窗**

```vue
<!-- components/project/CreateProjectDialog.vue -->
<script setup lang="ts">
const props = defineProps<{ open: boolean; teams: Array<{ id: string; name: string }> }>()
const emit = defineEmits<{
  (e: 'created', project: any): void
  (e: 'close'): void
}>()

const { $api } = useApi()
const form = reactive({
  team_id: '',
  title: '',
  genre: '',
  audience: '女频',
  tone: '甜',
  ending_type: 'HE',
  total_episodes: 60,
})
const loading = ref(false)
const error = ref('')

watch(() => props.open, (v) => {
  if (v && props.teams.length > 0 && !form.team_id) {
    form.team_id = props.teams[0].id
  }
})

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    const genreArr = form.genre ? form.genre.split(/[,，、]/).map(s => s.trim()).filter(Boolean) : []
    const project = await $api('/api/projects', {
      method: 'POST',
      body: { ...form, genre: genreArr },
    })
    emit('created', project)
  } catch (e: any) {
    error.value = e.data?.statusMessage || '创建失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="(v) => { if (!v) emit('close') }">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>新建项目</DialogTitle>
        <DialogDescription>填写基本信息创建一个新的短剧项目</DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-4 mt-2">
        <div class="space-y-2">
          <Label>团队</Label>
          <select v-model="form.team_id" class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>

        <div class="space-y-2">
          <Label>剧名</Label>
          <Input v-model="form.title" placeholder="输入剧名" required />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label>题材</Label>
            <Input v-model="form.genre" placeholder="霸道总裁, 甜宠" />
          </div>
          <div class="space-y-2">
            <Label>总集数</Label>
            <Input v-model.number="form.total_episodes" type="number" min="1" />
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div class="space-y-2">
            <Label>受众</Label>
            <select v-model="form.audience" class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="女频">女频</option>
              <option value="男频">男频</option>
              <option value="全年龄">全年龄</option>
            </select>
          </div>
          <div class="space-y-2">
            <Label>调性</Label>
            <select v-model="form.tone" class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="甜">甜</option>
              <option value="虐">虐</option>
              <option value="甜虐">甜虐</option>
              <option value="爽">爽</option>
              <option value="燃">燃</option>
              <option value="搞笑">搞笑</option>
            </select>
          </div>
          <div class="space-y-2">
            <Label>结局</Label>
            <select v-model="form.ending_type" class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="HE">HE</option>
              <option value="BE">BE</option>
              <option value="OE">OE</option>
            </select>
          </div>
        </div>

        <div v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {{ error }}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="emit('close')">取消</Button>
          <Button type="submit" :disabled="loading || !form.title || !form.team_id">
            {{ loading ? '创建中...' : '创建项目' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
```

---

## Chunk 6: 前端页面 — 项目列表、项目详情

### Task 26: 项目列表页

**Files:**
- Create: `pages/projects/index.vue`

- [ ] **Step 1: 实现项目列表页**

```vue
<!-- pages/projects/index.vue -->
<script setup lang="ts">
import { Plus, Clapperboard } from 'lucide-vue-next'

const { $api } = useApi()
const showCreate = ref(false)

const { data: projects, refresh } = useAsyncData('projects', () =>
  $api<any[]>('/api/projects'),
)

const { data: teams } = useAsyncData('my-teams', () =>
  $api<any[]>('/api/teams'),
)

function handleCreated() {
  showCreate.value = false
  refresh()
}
</script>

<template>
  <LayoutAppLayout>
    <template #title>项目</template>

    <div class="max-w-5xl">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-bold text-zinc-900">我的项目</h2>
          <p class="text-sm text-zinc-500 mt-0.5">管理你的短剧创作项目</p>
        </div>
        <Button @click="showCreate = true" class="gap-2">
          <Plus class="h-4 w-4" />
          新建项目
        </Button>
      </div>

      <div v-if="projects?.length" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ProjectProjectCard
          v-for="p in projects"
          :key="p.id"
          :project="p"
        />
      </div>

      <CommonEmptyState
        v-else
        :icon="Clapperboard"
        title="暂无项目"
        description="创建你的第一个短剧项目开始创作"
      >
        <Button @click="showCreate = true" size="sm" class="gap-2">
          <Plus class="h-3.5 w-3.5" />
          新建项目
        </Button>
      </CommonEmptyState>
    </div>

    <ProjectCreateProjectDialog
      :open="showCreate"
      :teams="teams || []"
      @created="handleCreated"
      @close="showCreate = false"
    />
  </LayoutAppLayout>
</template>
```

---

### Task 27: 项目详情概览页

**Files:**
- Create: `pages/projects/[id]/index.vue`

- [ ] **Step 1: 实现项目概览页**

```vue
<!-- pages/projects/[id]/index.vue -->
<script setup lang="ts">
import { Film, Users, BookOpen, ListOrdered, MapPin, Sparkles } from 'lucide-vue-next'

const route = useRoute()
const projectId = route.params.id as string
const { $api } = useApi()

const { data: project } = useAsyncData(`project-${projectId}`, () =>
  $api<any>(`/api/projects/${projectId}`),
)

const { data: characters } = useAsyncData(`chars-${projectId}`, () =>
  $api<any[]>(`/api/projects/${projectId}/characters`),
)

const { data: episodes } = useAsyncData(`eps-${projectId}`, () =>
  $api<any[]>(`/api/projects/${projectId}/episodes`),
)

const { data: scenes } = useAsyncData(`scenes-${projectId}`, () =>
  $api<any[]>(`/api/projects/${projectId}/scenes`),
)

const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-zinc-100 text-zinc-600' },
  in_progress: { label: '进行中', color: 'bg-indigo-50 text-indigo-700' },
  review: { label: '审核中', color: 'bg-amber-50 text-amber-700' },
  completed: { label: '已完成', color: 'bg-emerald-50 text-emerald-700' },
}

const stats = computed(() => [
  { label: '角色', value: characters.value?.length || 0, icon: Users },
  { label: '分集', value: episodes.value?.length || 0, icon: ListOrdered },
  { label: '场景', value: scenes.value?.length || 0, icon: MapPin },
])
</script>

<template>
  <LayoutAppLayout>
    <template #title>{{ project?.data?.title || '项目详情' }}</template>

    <div class="max-w-5xl" v-if="project?.data">
      <ProjectProjectSubNav :project-id="projectId" />

      <div class="space-y-6">
        <!-- 项目元信息 -->
        <div class="bg-white rounded-2xl border border-zinc-200/60 p-6 shadow-sm">
          <div class="flex items-start justify-between">
            <div>
              <h2 class="text-xl font-bold text-zinc-900">{{ project.data.title }}</h2>
              <div class="flex items-center gap-3 mt-2 text-sm text-zinc-500">
                <span>{{ (project.data.genre || []).join(' · ') || '未设置题材' }}</span>
                <span>·</span>
                <span>{{ project.data.audience || '未设置受众' }}</span>
                <span>·</span>
                <span>{{ project.data.total_episodes }}集</span>
              </div>
            </div>
            <Badge
              :class="statusMap[project.data.status]?.color"
              variant="secondary"
            >
              {{ statusMap[project.data.status]?.label || project.data.status }}
            </Badge>
          </div>
        </div>

        <!-- 统计卡片 -->
        <div class="grid grid-cols-3 gap-4">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="bg-white rounded-xl border border-zinc-200/60 p-5 shadow-sm"
          >
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center">
                <component :is="stat.icon" class="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p class="text-2xl font-bold text-zinc-900">{{ stat.value }}</p>
                <p class="text-xs text-zinc-500">{{ stat.label }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 项目详情属性 -->
        <div class="bg-white rounded-2xl border border-zinc-200/60 p-6 shadow-sm">
          <h3 class="text-sm font-semibold text-zinc-900 mb-4">项目信息</h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p class="text-zinc-400">调性</p>
              <p class="font-medium text-zinc-800">{{ project.data.tone || '—' }}</p>
            </div>
            <div>
              <p class="text-zinc-400">结局类型</p>
              <p class="font-medium text-zinc-800">{{ project.data.ending_type || '—' }}</p>
            </div>
            <div>
              <p class="text-zinc-400">语言</p>
              <p class="font-medium text-zinc-800">{{ project.data.language || '—' }}</p>
            </div>
            <div>
              <p class="text-zinc-400">模式</p>
              <p class="font-medium text-zinc-800">{{ project.data.mode === 'domestic' ? '国内' : '出海' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </LayoutAppLayout>
</template>
```

---

## Chunk 7: 前端页面 — 角色、场景道具、分集

### Task 28: 角色管理页

**Files:**
- Create: `pages/projects/[id]/characters.vue`

- [ ] **Step 1: 实现角色管理页**

页面功能：
- 角色卡片列表（头像占位 + 名字 + 身份 + 性格标签）
- 新建角色弹窗（Sheet 从右滑入）
- 编辑角色（点击卡片打开 Sheet）
- 删除角色（确认弹窗）
- 启用/禁用切换

```vue
<!-- pages/projects/[id]/characters.vue -->
<script setup lang="ts">
import { Plus, User, Pencil, Trash2 } from 'lucide-vue-next'

const route = useRoute()
const projectId = route.params.id as string
const { $api } = useApi()

const { data: project } = useAsyncData(`project-${projectId}`, () =>
  $api<any>(`/api/projects/${projectId}`),
)

const { data: characters, refresh } = useAsyncData(`chars-${projectId}`, () =>
  $api<any[]>(`/api/projects/${projectId}/characters`),
)

const editing = ref<any>(null)
const showForm = ref(false)
const confirmDelete = ref<any>(null)
const form = reactive({
  name: '',
  age: null as number | null,
  appearance: '',
  personality_tags: '',
  public_identity: '',
  real_identity: '',
  motivation: '',
  catchphrase: '',
})
const loading = ref(false)
const error = ref('')

function openCreate() {
  editing.value = null
  Object.assign(form, { name: '', age: null, appearance: '', personality_tags: '', public_identity: '', real_identity: '', motivation: '', catchphrase: '' })
  error.value = ''
  showForm.value = true
}

function openEdit(c: any) {
  editing.value = c
  Object.assign(form, {
    name: c.name,
    age: c.age,
    appearance: c.appearance || '',
    personality_tags: (c.personality_tags || []).join(', '),
    public_identity: c.public_identity || '',
    real_identity: c.real_identity || '',
    motivation: c.motivation || '',
    catchphrase: c.catchphrase || '',
  })
  error.value = ''
  showForm.value = true
}

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    const tags = form.personality_tags ? form.personality_tags.split(/[,，、]/).map(s => s.trim()).filter(Boolean) : []
    const body = { ...form, personality_tags: tags, age: form.age || undefined }
    if (editing.value) {
      await $api(`/api/projects/${projectId}/characters/${editing.value.id}`, { method: 'PUT', body })
    } else {
      await $api(`/api/projects/${projectId}/characters`, { method: 'POST', body })
    }
    showForm.value = false
    refresh()
  } catch (e: any) {
    error.value = e.data?.statusMessage || '操作失败'
  } finally {
    loading.value = false
  }
}

async function handleDelete() {
  if (!confirmDelete.value) return
  try {
    await $api(`/api/projects/${projectId}/characters/${confirmDelete.value.id}`, { method: 'DELETE' })
    confirmDelete.value = null
    refresh()
  } catch (e: any) {
    error.value = e.data?.statusMessage || '删除失败'
  }
}
</script>

<template>
  <LayoutAppLayout>
    <template #title>{{ project?.data?.title || '项目' }} — 角色</template>

    <div class="max-w-5xl">
      <ProjectProjectSubNav :project-id="projectId" />

      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-bold text-zinc-900">角色管理</h2>
        <Button @click="openCreate" size="sm" class="gap-2">
          <Plus class="h-3.5 w-3.5" />
          新建角色
        </Button>
      </div>

      <div v-if="characters?.data?.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="c in characters.data"
          :key="c.id"
          class="bg-white rounded-xl border border-zinc-200/60 p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div class="flex items-start gap-3">
            <div class="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center shrink-0">
              <User class="h-5 w-5 text-indigo-600" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-semibold text-zinc-900 truncate">{{ c.name }}</h3>
                <Badge v-if="!c.is_active" variant="secondary" class="bg-zinc-100 text-zinc-400 text-[10px]">已禁用</Badge>
              </div>
              <p class="text-xs text-zinc-500 mt-0.5">{{ c.public_identity || '未设置身份' }}</p>
              <div v-if="c.personality_tags?.length" class="flex flex-wrap gap-1 mt-2">
                <span
                  v-for="tag in c.personality_tags.slice(0, 4)"
                  :key="tag"
                  class="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
          <div class="flex gap-1 mt-3 pt-3 border-t border-zinc-100">
            <Button variant="ghost" size="sm" class="h-7 text-xs text-zinc-500 hover:text-indigo-600" @click="openEdit(c)">
              <Pencil class="h-3 w-3 mr-1" /> 编辑
            </Button>
            <Button variant="ghost" size="sm" class="h-7 text-xs text-zinc-500 hover:text-red-600" @click="confirmDelete = c">
              <Trash2 class="h-3 w-3 mr-1" /> 删除
            </Button>
          </div>
        </div>
      </div>

      <CommonEmptyState v-else :icon="User" title="暂无角色" description="添加第一个角色开始创作">
        <Button @click="openCreate" size="sm" class="gap-2">
          <Plus class="h-3.5 w-3.5" /> 新建角色
        </Button>
      </CommonEmptyState>
    </div>

    <!-- 角色表单 Sheet -->
    <Sheet :open="showForm" @update:open="(v) => { if (!v) showForm = false }">
      <SheetContent class="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{{ editing ? '编辑角色' : '新建角色' }}</SheetTitle>
        </SheetHeader>
        <form @submit.prevent="handleSubmit" class="space-y-4 mt-4">
          <div class="space-y-2">
            <Label>角色名 *</Label>
            <Input v-model="form.name" required placeholder="输入角色名" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>年龄</Label>
              <Input v-model.number="form.age" type="number" placeholder="如 25" />
            </div>
            <div class="space-y-2">
              <Label>公开身份</Label>
              <Input v-model="form.public_identity" placeholder="如 甜品店老板" />
            </div>
          </div>
          <div class="space-y-2">
            <Label>真实身份</Label>
            <Input v-model="form.real_identity" placeholder="如 集团继承人" />
          </div>
          <div class="space-y-2">
            <Label>性格标签</Label>
            <Input v-model="form.personality_tags" placeholder="倔强, 善良, 聪明（逗号分隔）" />
          </div>
          <div class="space-y-2">
            <Label>外貌描述</Label>
            <Textarea v-model="form.appearance" placeholder="描述角色外貌" rows="2" />
          </div>
          <div class="space-y-2">
            <Label>核心动机</Label>
            <Textarea v-model="form.motivation" placeholder="角色的核心驱动力" rows="2" />
          </div>
          <div class="space-y-2">
            <Label>口头禅</Label>
            <Input v-model="form.catchphrase" placeholder="角色的口头禅" />
          </div>

          <div v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {{ error }}
          </div>

          <div class="flex gap-2 pt-2">
            <Button type="button" variant="outline" @click="showForm = false" class="flex-1">取消</Button>
            <Button type="submit" :disabled="loading || !form.name" class="flex-1">
              {{ loading ? '保存中...' : (editing ? '保存修改' : '创建角色') }}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>

    <!-- 删除确认 -->
    <CommonConfirmDialog
      :open="!!confirmDelete"
      title="删除角色"
      :description="`确定删除角色「${confirmDelete?.name}」吗？此操作不可撤销。`"
      confirm-text="删除"
      destructive
      @confirm="handleDelete"
      @cancel="confirmDelete = null"
    />
  </LayoutAppLayout>
</template>
```

---

### Task 29: 场景与道具管理页

**Files:**
- Create: `pages/projects/[id]/scenes.vue`

- [ ] **Step 1: 实现场景与道具管理页**

页面功能：
- Tab 切换场景/道具
- 列表展示 + 新建/编辑（Sheet）
- 场景：名称 + 内外景 + 日夜 + 标签
- 道具：名称 + 描述 + 标签

```vue
<!-- pages/projects/[id]/scenes.vue -->
<script setup lang="ts">
import { Plus, MapPin, Box, Pencil } from 'lucide-vue-next'

const route = useRoute()
const projectId = route.params.id as string
const { $api } = useApi()

const activeTab = ref('scenes')

const { data: project } = useAsyncData(`project-${projectId}`, () => $api<any>(`/api/projects/${projectId}`))

const { data: scenes, refresh: refreshScenes } = useAsyncData(`scenes-${projectId}`, () =>
  $api<any[]>(`/api/projects/${projectId}/scenes`),
)

const { data: props, refresh: refreshProps } = useAsyncData(`props-${projectId}`, () =>
  $api<any[]>(`/api/projects/${projectId}/props`),
)

// Scene form
const showSceneForm = ref(false)
const editingScene = ref<any>(null)
const sceneForm = reactive({ name: '', location_type: 'int', time_of_day: 'day', description: '', tags: '' })
const sceneLoading = ref(false)
const sceneError = ref('')

function openSceneCreate() {
  editingScene.value = null
  Object.assign(sceneForm, { name: '', location_type: 'int', time_of_day: 'day', description: '', tags: '' })
  sceneError.value = ''
  showSceneForm.value = true
}

function openSceneEdit(s: any) {
  editingScene.value = s
  Object.assign(sceneForm, {
    name: s.name,
    location_type: s.location_type || 'int',
    time_of_day: s.time_of_day || 'day',
    description: s.description || '',
    tags: (s.tags || []).join(', '),
  })
  sceneError.value = ''
  showSceneForm.value = true
}

async function submitScene() {
  sceneError.value = ''
  sceneLoading.value = true
  try {
    const tagsArr = sceneForm.tags ? sceneForm.tags.split(/[,，、]/).map(s => s.trim()).filter(Boolean) : []
    const body = { ...sceneForm, tags: tagsArr }
    if (editingScene.value) {
      await $api(`/api/projects/${projectId}/scenes/${editingScene.value.id}`, { method: 'PUT', body })
    } else {
      await $api(`/api/projects/${projectId}/scenes`, { method: 'POST', body })
    }
    showSceneForm.value = false
    refreshScenes()
  } catch (e: any) {
    sceneError.value = e.data?.statusMessage || '操作失败'
  } finally {
    sceneLoading.value = false
  }
}

// Prop form
const showPropForm = ref(false)
const editingProp = ref<any>(null)
const propForm = reactive({ name: '', description: '', tags: '' })
const propLoading = ref(false)
const propError = ref('')

function openPropCreate() {
  editingProp.value = null
  Object.assign(propForm, { name: '', description: '', tags: '' })
  propError.value = ''
  showPropForm.value = true
}

function openPropEdit(p: any) {
  editingProp.value = p
  Object.assign(propForm, { name: p.name, description: p.description || '', tags: (p.tags || []).join(', ') })
  propError.value = ''
  showPropForm.value = true
}

async function submitProp() {
  propError.value = ''
  propLoading.value = true
  try {
    const tagsArr = propForm.tags ? propForm.tags.split(/[,，、]/).map(s => s.trim()).filter(Boolean) : []
    const body = { ...propForm, tags: tagsArr }
    if (editingProp.value) {
      await $api(`/api/projects/${projectId}/props/${editingProp.value.id}`, { method: 'PUT', body })
    } else {
      await $api(`/api/projects/${projectId}/props`, { method: 'POST', body })
    }
    showPropForm.value = false
    refreshProps()
  } catch (e: any) {
    propError.value = e.data?.statusMessage || '操作失败'
  } finally {
    propLoading.value = false
  }
}

const locationMap: Record<string, string> = { int: '室内', ext: '室外' }
const todMap: Record<string, string> = { day: '日景', night: '夜景', dawn: '黎明', dusk: '黄昏' }
</script>

<template>
  <LayoutAppLayout>
    <template #title>{{ project?.data?.title || '项目' }} — 场景与道具</template>

    <div class="max-w-5xl">
      <ProjectProjectSubNav :project-id="projectId" />

      <!-- Tab 切换 -->
      <div class="flex items-center gap-1 mb-6">
        <button
          v-for="tab in [{ key: 'scenes', label: '场景', icon: MapPin }, { key: 'props', label: '道具', icon: Box }]"
          :key="tab.key"
          :class="[
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            activeTab === tab.key ? 'bg-indigo-50 text-indigo-700' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50',
          ]"
          @click="activeTab = tab.key"
        >
          <component :is="tab.icon" class="h-4 w-4" />
          {{ tab.label }}
        </button>
        <div class="flex-1" />
        <Button v-if="activeTab === 'scenes'" @click="openSceneCreate" size="sm" class="gap-2">
          <Plus class="h-3.5 w-3.5" /> 新建场景
        </Button>
        <Button v-else @click="openPropCreate" size="sm" class="gap-2">
          <Plus class="h-3.5 w-3.5" /> 新建道具
        </Button>
      </div>

      <!-- 场景列表 -->
      <div v-if="activeTab === 'scenes'">
        <div v-if="scenes?.data?.length" class="space-y-3">
          <div
            v-for="s in scenes.data"
            :key="s.id"
            class="bg-white rounded-xl border border-zinc-200/60 p-4 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div class="flex items-center gap-3">
              <div class="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <MapPin class="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <h3 class="text-sm font-medium text-zinc-900">{{ s.name }}</h3>
                <p class="text-xs text-zinc-400">
                  {{ locationMap[s.location_type] || s.location_type }} · {{ todMap[s.time_of_day] || s.time_of_day }}
                </p>
              </div>
              <div v-if="s.tags?.length" class="flex gap-1 ml-2">
                <span v-for="tag in s.tags.slice(0, 3)" :key="tag" class="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600">{{ tag }}</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" class="h-7 text-xs text-zinc-400" @click="openSceneEdit(s)">
              <Pencil class="h-3 w-3" />
            </Button>
          </div>
        </div>
        <CommonEmptyState v-else :icon="MapPin" title="暂无场景" description="添加拍摄场景">
          <Button @click="openSceneCreate" size="sm" class="gap-2"><Plus class="h-3.5 w-3.5" /> 新建场景</Button>
        </CommonEmptyState>
      </div>

      <!-- 道具列表 -->
      <div v-if="activeTab === 'props'">
        <div v-if="props?.data?.length" class="space-y-3">
          <div
            v-for="p in props.data"
            :key="p.id"
            class="bg-white rounded-xl border border-zinc-200/60 p-4 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div class="flex items-center gap-3">
              <div class="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center">
                <Box class="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <h3 class="text-sm font-medium text-zinc-900">{{ p.name }}</h3>
                <p v-if="p.description" class="text-xs text-zinc-400 truncate max-w-xs">{{ p.description }}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" class="h-7 text-xs text-zinc-400" @click="openPropEdit(p)">
              <Pencil class="h-3 w-3" />
            </Button>
          </div>
        </div>
        <CommonEmptyState v-else :icon="Box" title="暂无道具" description="添加关键道具">
          <Button @click="openPropCreate" size="sm" class="gap-2"><Plus class="h-3.5 w-3.5" /> 新建道具</Button>
        </CommonEmptyState>
      </div>
    </div>

    <!-- Scene Sheet -->
    <Sheet :open="showSceneForm" @update:open="(v) => { if (!v) showSceneForm = false }">
      <SheetContent class="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{{ editingScene ? '编辑场景' : '新建场景' }}</SheetTitle>
        </SheetHeader>
        <form @submit.prevent="submitScene" class="space-y-4 mt-4">
          <div class="space-y-2"><Label>场景名 *</Label><Input v-model="sceneForm.name" required placeholder="如 念念甜品屋" /></div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>内/外景</Label>
              <select v-model="sceneForm.location_type" class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="int">室内</option><option value="ext">室外</option>
              </select>
            </div>
            <div class="space-y-2">
              <Label>时间</Label>
              <select v-model="sceneForm.time_of_day" class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="day">日景</option><option value="night">夜景</option><option value="dawn">黎明</option><option value="dusk">黄昏</option>
              </select>
            </div>
          </div>
          <div class="space-y-2"><Label>描述</Label><Textarea v-model="sceneForm.description" rows="3" placeholder="场景描述" /></div>
          <div class="space-y-2"><Label>标签</Label><Input v-model="sceneForm.tags" placeholder="温馨, 浪漫（逗号分隔）" /></div>
          <div v-if="sceneError" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{{ sceneError }}</div>
          <div class="flex gap-2 pt-2">
            <Button type="button" variant="outline" @click="showSceneForm = false" class="flex-1">取消</Button>
            <Button type="submit" :disabled="sceneLoading || !sceneForm.name" class="flex-1">{{ sceneLoading ? '保存中...' : '保存' }}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>

    <!-- Prop Sheet -->
    <Sheet :open="showPropForm" @update:open="(v) => { if (!v) showPropForm = false }">
      <SheetContent class="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{{ editingProp ? '编辑道具' : '新建道具' }}</SheetTitle>
        </SheetHeader>
        <form @submit.prevent="submitProp" class="space-y-4 mt-4">
          <div class="space-y-2"><Label>道具名 *</Label><Input v-model="propForm.name" required placeholder="如 家族戒指" /></div>
          <div class="space-y-2"><Label>描述</Label><Textarea v-model="propForm.description" rows="3" placeholder="道具描述和用途" /></div>
          <div class="space-y-2"><Label>标签</Label><Input v-model="propForm.tags" placeholder="关键道具, 剧情推动（逗号分隔）" /></div>
          <div v-if="propError" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{{ propError }}</div>
          <div class="flex gap-2 pt-2">
            <Button type="button" variant="outline" @click="showPropForm = false" class="flex-1">取消</Button>
            <Button type="submit" :disabled="propLoading || !propForm.name" class="flex-1">{{ propLoading ? '保存中...' : '保存' }}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  </LayoutAppLayout>
</template>
```

---

### Task 30: 分集目录管理页

**Files:**
- Create: `pages/projects/[id]/episodes.vue`

- [ ] **Step 1: 实现分集目录页**

页面功能：
- 表格视图（集号 + 标题 + 钩子类型 + 状态 + 标记）
- 新建分集弹窗
- 编辑分集（Sheet）
- 🔥/💰 标记展示

```vue
<!-- pages/projects/[id]/episodes.vue -->
<script setup lang="ts">
import { Plus, ListOrdered, Pencil, Flame, Banknote } from 'lucide-vue-next'

const route = useRoute()
const projectId = route.params.id as string
const { $api } = useApi()

const { data: project } = useAsyncData(`project-${projectId}`, () => $api<any>(`/api/projects/${projectId}`))
const { data: episodes, refresh } = useAsyncData(`eps-${projectId}`, () =>
  $api<any[]>(`/api/projects/${projectId}/episodes`),
)

const showForm = ref(false)
const editing = ref<any>(null)
const form = reactive({
  episode_number: 1,
  title: '',
  synopsis: '',
  hook_type: '',
  is_key_episode: false,
  is_paywall: false,
  act: 1,
  rhythm_phase: '起势',
  status: 'planned',
})
const loading = ref(false)
const error = ref('')

function openCreate() {
  editing.value = null
  const nextNum = (episodes.value?.data?.length || 0) + 1
  Object.assign(form, { episode_number: nextNum, title: '', synopsis: '', hook_type: '', is_key_episode: false, is_paywall: false, act: 1, rhythm_phase: '起势', status: 'planned' })
  error.value = ''
  showForm.value = true
}

function openEdit(ep: any) {
  editing.value = ep
  Object.assign(form, {
    episode_number: ep.episode_number,
    title: ep.title || '',
    synopsis: ep.synopsis || '',
    hook_type: ep.hook_type || '',
    is_key_episode: ep.is_key_episode,
    is_paywall: ep.is_paywall,
    act: ep.act || 1,
    rhythm_phase: ep.rhythm_phase || '起势',
    status: ep.status,
  })
  error.value = ''
  showForm.value = true
}

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    if (editing.value) {
      await $api(`/api/projects/${projectId}/episodes/${editing.value.episode_number}`, { method: 'PUT', body: form })
    } else {
      await $api(`/api/projects/${projectId}/episodes`, { method: 'POST', body: form })
    }
    showForm.value = false
    refresh()
  } catch (e: any) {
    error.value = e.data?.statusMessage || '操作失败'
  } finally {
    loading.value = false
  }
}

const statusMap: Record<string, { label: string; color: string }> = {
  planned: { label: '待编写', color: 'bg-zinc-100 text-zinc-600' },
  writing: { label: '编写中', color: 'bg-indigo-50 text-indigo-700' },
  written: { label: '已完成', color: 'bg-emerald-50 text-emerald-700' },
}

const hookTypes = ['悬念钩', '反转钩', '情绪钩', '信息钩', '危机钩']
const rhythmPhases = ['起势', '攀升', '风暴', '决战']
</script>

<template>
  <LayoutAppLayout>
    <template #title>{{ project?.data?.title || '项目' }} — 分集</template>

    <div class="max-w-5xl">
      <ProjectProjectSubNav :project-id="projectId" />

      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-bold text-zinc-900">分集目录</h2>
        <Button @click="openCreate" size="sm" class="gap-2">
          <Plus class="h-3.5 w-3.5" />
          新建分集
        </Button>
      </div>

      <div v-if="episodes?.data?.length" class="bg-white rounded-xl border border-zinc-200/60 shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-zinc-50/80 border-b border-zinc-100">
              <th class="text-left px-4 py-3 font-medium text-zinc-500 w-16">集号</th>
              <th class="text-left px-4 py-3 font-medium text-zinc-500">标题</th>
              <th class="text-left px-4 py-3 font-medium text-zinc-500 w-24">钩子</th>
              <th class="text-left px-4 py-3 font-medium text-zinc-500 w-20">节奏</th>
              <th class="text-center px-4 py-3 font-medium text-zinc-500 w-16">标记</th>
              <th class="text-left px-4 py-3 font-medium text-zinc-500 w-20">状态</th>
              <th class="w-12" />
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-50">
            <tr
              v-for="ep in episodes.data"
              :key="ep.id"
              class="hover:bg-zinc-50/50 transition-colors"
            >
              <td class="px-4 py-3 font-mono text-zinc-400">{{ String(ep.episode_number).padStart(2, '0') }}</td>
              <td class="px-4 py-3 font-medium text-zinc-900">{{ ep.title || '—' }}</td>
              <td class="px-4 py-3 text-xs text-zinc-500">{{ ep.hook_type || '—' }}</td>
              <td class="px-4 py-3 text-xs text-zinc-500">{{ ep.rhythm_phase || '—' }}</td>
              <td class="px-4 py-3 text-center">
                <span v-if="ep.is_key_episode" title="重点集">🔥</span>
                <span v-if="ep.is_paywall" title="付费卡点">💰</span>
              </td>
              <td class="px-4 py-3">
                <Badge :class="statusMap[ep.status]?.color" variant="secondary" class="text-[10px]">
                  {{ statusMap[ep.status]?.label || ep.status }}
                </Badge>
              </td>
              <td class="px-4 py-3">
                <Button variant="ghost" size="sm" class="h-7 w-7 p-0 text-zinc-400" @click="openEdit(ep)">
                  <Pencil class="h-3 w-3" />
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <CommonEmptyState v-else :icon="ListOrdered" title="暂无分集" description="添加分集开始规划剧集">
        <Button @click="openCreate" size="sm" class="gap-2"><Plus class="h-3.5 w-3.5" /> 新建分集</Button>
      </CommonEmptyState>
    </div>

    <!-- Episode Sheet -->
    <Sheet :open="showForm" @update:open="(v) => { if (!v) showForm = false }">
      <SheetContent class="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{{ editing ? `编辑第${form.episode_number}集` : '新建分集' }}</SheetTitle>
        </SheetHeader>
        <form @submit.prevent="handleSubmit" class="space-y-4 mt-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>集号 *</Label>
              <Input v-model.number="form.episode_number" type="number" min="1" required :disabled="!!editing" />
            </div>
            <div class="space-y-2">
              <Label>所属幕</Label>
              <select v-model.number="form.act" class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option :value="1">第一幕</option><option :value="2">第二幕</option><option :value="3">第三幕</option>
              </select>
            </div>
          </div>
          <div class="space-y-2"><Label>标题</Label><Input v-model="form.title" placeholder="集标题" /></div>
          <div class="space-y-2"><Label>概要</Label><Textarea v-model="form.synopsis" rows="2" placeholder="一句话概要" /></div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>钩子类型</Label>
              <select v-model="form.hook_type" class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">无</option>
                <option v-for="h in hookTypes" :key="h" :value="h">{{ h }}</option>
              </select>
            </div>
            <div class="space-y-2">
              <Label>节奏段落</Label>
              <select v-model="form.rhythm_phase" class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option v-for="r in rhythmPhases" :key="r" :value="r">{{ r }}</option>
              </select>
            </div>
          </div>
          <div class="flex gap-6">
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="form.is_key_episode" class="rounded border-zinc-300" />
              🔥 重点集
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="form.is_paywall" class="rounded border-zinc-300" />
              💰 付费卡点
            </label>
          </div>
          <div v-if="editing" class="space-y-2">
            <Label>状态</Label>
            <select v-model="form.status" class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="planned">待编写</option><option value="writing">编写中</option><option value="written">已完成</option>
            </select>
          </div>
          <div v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{{ error }}</div>
          <div class="flex gap-2 pt-2">
            <Button type="button" variant="outline" @click="showForm = false" class="flex-1">取消</Button>
            <Button type="submit" :disabled="loading" class="flex-1">{{ loading ? '保存中...' : '保存' }}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  </LayoutAppLayout>
</template>
```

---

## Chunk 8: 团队管理页

### Task 31: 团队管理页

**Files:**
- Create: `pages/teams/index.vue`

- [ ] **Step 1: 实现团队管理页**

```vue
<!-- pages/teams/index.vue -->
<script setup lang="ts">
import { Plus, Users, UserPlus, Settings } from 'lucide-vue-next'

const { $api } = useApi()

const { data: teams, refresh } = useAsyncData('my-teams', () =>
  $api<any[]>('/api/teams'),
)

const showCreate = ref(false)
const createForm = reactive({ name: '', description: '' })
const createLoading = ref(false)
const createError = ref('')
const expandedTeam = ref<string | null>(null)
const members = ref<Record<string, any[]>>({})

const showAddMember = ref(false)
const addMemberTeamId = ref('')
const memberForm = reactive({ email: '', role: 'editor' })
const memberLoading = ref(false)
const memberError = ref('')

async function createTeam() {
  createError.value = ''
  createLoading.value = true
  try {
    await $api('/api/teams', { method: 'POST', body: createForm })
    showCreate.value = false
    Object.assign(createForm, { name: '', description: '' })
    refresh()
  } catch (e: any) {
    createError.value = e.data?.statusMessage || '创建失败'
  } finally {
    createLoading.value = false
  }
}

async function toggleTeam(teamId: string) {
  if (expandedTeam.value === teamId) {
    expandedTeam.value = null
    return
  }
  expandedTeam.value = teamId
  if (!members.value[teamId]) {
    const res = await $api<any[]>(`/api/teams/${teamId}/members`)
    members.value[teamId] = (res as any).data || res
  }
}

function openAddMember(teamId: string) {
  addMemberTeamId.value = teamId
  Object.assign(memberForm, { email: '', role: 'editor' })
  memberError.value = ''
  showAddMember.value = true
}

async function addMember() {
  memberError.value = ''
  memberLoading.value = true
  try {
    await $api(`/api/teams/${addMemberTeamId.value}/members`, { method: 'POST', body: memberForm })
    showAddMember.value = false
    const res = await $api<any[]>(`/api/teams/${addMemberTeamId.value}/members`)
    members.value[addMemberTeamId.value] = (res as any).data || res
  } catch (e: any) {
    memberError.value = e.data?.statusMessage || '添加失败'
  } finally {
    memberLoading.value = false
  }
}

const roleMap: Record<string, string> = { owner: '所有者', editor: '编辑者', viewer: '查看者' }
</script>

<template>
  <LayoutAppLayout>
    <template #title>团队</template>

    <div class="max-w-3xl">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-bold text-zinc-900">我的团队</h2>
          <p class="text-sm text-zinc-500 mt-0.5">管理团队和成员</p>
        </div>
        <Button @click="showCreate = true" class="gap-2">
          <Plus class="h-4 w-4" /> 新建团队
        </Button>
      </div>

      <div v-if="teams?.data?.length" class="space-y-4">
        <div v-for="team in teams.data" :key="team.id" class="bg-white rounded-xl border border-zinc-200/60 shadow-sm overflow-hidden">
          <div class="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-zinc-50/50 transition-colors" @click="toggleTeam(team.id)">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
                <Users class="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 class="text-sm font-semibold text-zinc-900">{{ team.name }}</h3>
                <p v-if="team.description" class="text-xs text-zinc-400">{{ team.description }}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" class="text-xs text-zinc-400" @click.stop="openAddMember(team.id)">
              <UserPlus class="h-3.5 w-3.5 mr-1" /> 邀请
            </Button>
          </div>

          <div v-if="expandedTeam === team.id && members[team.id]" class="border-t border-zinc-100 px-5 py-3">
            <div v-for="m in members[team.id]" :key="m.id" class="flex items-center justify-between py-2">
              <div class="flex items-center gap-2">
                <div class="h-7 w-7 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-medium text-zinc-600">
                  {{ m.user_name?.charAt(0) || '?' }}
                </div>
                <span class="text-sm text-zinc-800">{{ m.user_name || m.user_email }}</span>
              </div>
              <Badge variant="secondary" class="text-[10px]">{{ roleMap[m.role] || m.role }}</Badge>
            </div>
          </div>
        </div>
      </div>

      <CommonEmptyState v-else :icon="Users" title="暂无团队" description="创建一个团队开始协作">
        <Button @click="showCreate = true" size="sm" class="gap-2"><Plus class="h-3.5 w-3.5" /> 新建团队</Button>
      </CommonEmptyState>
    </div>

    <!-- 创建团队 -->
    <Dialog :open="showCreate" @update:open="(v) => { if (!v) showCreate = false }">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新建团队</DialogTitle>
        </DialogHeader>
        <form @submit.prevent="createTeam" class="space-y-4 mt-2">
          <div class="space-y-2"><Label>团队名称 *</Label><Input v-model="createForm.name" required placeholder="输入团队名称" /></div>
          <div class="space-y-2"><Label>描述</Label><Textarea v-model="createForm.description" rows="2" placeholder="团队描述（可选）" /></div>
          <div v-if="createError" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{{ createError }}</div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="showCreate = false">取消</Button>
            <Button type="submit" :disabled="createLoading || !createForm.name">{{ createLoading ? '创建中...' : '创建' }}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- 添加成员 -->
    <Dialog :open="showAddMember" @update:open="(v) => { if (!v) showAddMember = false }">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>邀请成员</DialogTitle>
        </DialogHeader>
        <form @submit.prevent="addMember" class="space-y-4 mt-2">
          <div class="space-y-2"><Label>邮箱 *</Label><Input v-model="memberForm.email" type="email" required placeholder="成员邮箱" /></div>
          <div class="space-y-2">
            <Label>角色</Label>
            <select v-model="memberForm.role" class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="editor">编辑者</option><option value="viewer">查看者</option>
            </select>
          </div>
          <div v-if="memberError" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{{ memberError }}</div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="showAddMember = false">取消</Button>
            <Button type="submit" :disabled="memberLoading || !memberForm.email">{{ memberLoading ? '添加中...' : '添加' }}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </LayoutAppLayout>
</template>
```

---

## 执行依赖顺序

```
Task 1 (类型) → 并行执行 Task 2-8 (Models)
→ 并行执行 Task 9-14 (Services)
→ 并行执行 Task 15-20 (API Routes)
→ Task 21 (Shadcn组件安装)
→ 并行执行 Task 22-25 (前端组件)
→ 并行执行 Task 26-31 (前端页面)
```

需安装的 Shadcn-vue 组件: `dialog`, `sheet`, `textarea` (其余已有)
