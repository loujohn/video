# Phase 1: 短剧管理平台基座搭建 — 实施计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建 Nuxt.js + Knex + PostgreSQL 项目基座，包含数据库迁移、Core Service Layer 骨架、基础认证、团队 CRUD 和基础 UI 布局。

**Architecture:** API-First 单体架构，Nuxt.js 同时承载 SSR 前端和 Nitro API 后端。核心业务逻辑提取到 `core/` 目录作为纯 TypeScript 模块，`server/api/` 为薄包装层。PostgreSQL 通过 Knex.js 访问。

**Tech Stack:** Nuxt 3, Vue 3, TypeScript, Knex.js, PostgreSQL, TailwindCSS, PrimeVue (Aura theme), JWT (jose)

**UI Design Reference:** `~/.cursor/skills-cursor/ui-ux-pro-max-skill` — 使用此 Skill 在实现前端页面时指导配色、字体、布局风格决策

**Design Doc:** `docs/plans/2026-03-18-short-drama-platform-design.md`

---

## File Structure

```
video/
├── nuxt.config.ts
├── package.json
├── tsconfig.json
├── knexfile.ts
├── .env
├── .env.example
├── .gitignore
│
├── core/
│   ├── db.ts                          # Knex 实例初始化
│   ├── types/
│   │   ├── user.ts                    # User 类型定义
│   │   ├── team.ts                    # Team 类型定义
│   │   ├── project.ts                 # Project 类型定义
│   │   ├── character.ts               # Character 类型定义
│   │   ├── scene.ts                   # Scene 类型定义
│   │   ├── prop.ts                    # Prop 类型定义
│   │   ├── episode.ts                 # Episode 类型定义
│   │   ├── storyboard.ts             # Storyboard 类型定义
│   │   ├── asset.ts                   # Asset 类型定义
│   │   └── version.ts                 # EntityVersion 类型定义
│   ├── models/
│   │   ├── user.model.ts              # User 数据访问
│   │   ├── team.model.ts              # Team 数据访问
│   │   └── project.model.ts           # Project 数据访问
│   └── services/
│       ├── auth.service.ts            # 认证业务逻辑
│       ├── team.service.ts            # 团队业务逻辑
│       └── project.service.ts         # 项目业务逻辑（骨架）
│
├── server/
│   ├── utils/
│   │   ├── auth.ts                    # JWT 工具函数
│   │   └── response.ts               # 统一响应格式
│   ├── middleware/
│   │   └── auth.ts                    # 认证中间件
│   └── api/
│       ├── auth/
│       │   ├── register.post.ts       # 注册
│       │   ├── login.post.ts          # 登录
│       │   └── me.get.ts              # 当前用户信息
│       ├── teams/
│       │   ├── index.get.ts           # 列出我的团队
│       │   ├── index.post.ts          # 创建团队
│       │   └── [id]/
│       │       ├── index.get.ts       # 团队详情
│       │       ├── index.put.ts       # 更新团队
│       │       ├── members.get.ts     # 成员列表
│       │       └── members.post.ts    # 添加成员
│       └── projects/
│           ├── index.get.ts           # 项目列表
│           ├── index.post.ts          # 创建项目
│           └── [id]/
│               ├── index.get.ts       # 项目详情
│               └── index.put.ts       # 更新项目
│
├── pages/
│   ├── index.vue                      # 仪表盘
│   ├── login.vue                      # 登录页
│   └── register.vue                   # 注册页
│
├── components/
│   └── layout/
│       ├── AppSidebar.vue             # 侧边栏
│       ├── AppHeader.vue              # 顶部栏
│       └── AppLayout.vue              # 整体布局
│
├── composables/
│   ├── useAuth.ts                     # 认证状态管理
│   └── useApi.ts                      # API 调用封装
│
├── middleware/
│   └── auth.global.ts                 # 前端路由守卫
│
├── migrations/
│   └── 20260318000000_initial.ts      # 初始迁移（全部表）
│
└── seeds/
    └── 01_dev_seed.ts                 # 开发种子数据
```

---

## Chunk 1: 项目初始化与数据库

### Task 1: Nuxt.js 项目初始化

**Files:**
- Create: `package.json`
- Create: `nuxt.config.ts`
- Create: `tsconfig.json`
- Create: `.env`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: 初始化 Nuxt 项目**

```bash
cd /Users/loujohn/project/video
npx nuxi@latest init . --force --packageManager npm
```

- [ ] **Step 2: 安装核心依赖**

```bash
npm install knex pg uuid jose bcryptjs primevue @primevue/themes primeicons
npm install -D @types/uuid @types/bcryptjs tsx @nuxtjs/tailwindcss
```

注意：
- `tsx` 用于 Knex CLI 运行 TypeScript 迁移文件
- `primevue` + `@primevue/themes` 为 UI 组件库（使用 Aura 主题）
- `@nuxtjs/tailwindcss` 提供 Tailwind CSS 集成

- [ ] **Step 3: 配置 .env.example**

创建 `.env.example`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/drama_studio
JWT_SECRET=your-jwt-secret-change-in-production
JWT_EXPIRES_IN=7d
UPLOAD_DIR=./uploads
```

复制为 `.env`:
```bash
cp .env.example .env
```

- [ ] **Step 4: 配置 nuxt.config.ts**

```typescript
import Aura from '@primevue/themes/aura'

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  modules: [
    'primevue/nuxt',
    '@nuxtjs/tailwindcss',
  ],
  primevue: {
    options: {
      theme: {
        preset: Aura,
      },
    },
  },
  css: ['primeicons/primeicons.css'],
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/drama_studio',
    jwtSecret: process.env.JWT_SECRET || 'dev-secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    uploadDir: process.env.UPLOAD_DIR || './uploads',
  },
})
```

- [ ] **Step 5: 配置 .gitignore**

```gitignore
node_modules
.nuxt
.output
dist
.env
uploads/
*.log
```

- [ ] **Step 6: 验证项目能启动**

```bash
npm run dev
```

Expected: Nuxt 开发服务器在 http://localhost:3000 正常启动

- [ ] **Step 7: Commit**

```bash
git init
git add .
git commit -m "feat: initialize Nuxt.js project with core dependencies"
```

---

### Task 2: Knex 配置与数据库连接

**Files:**
- Create: `knexfile.ts`
- Create: `core/db.ts`

- [ ] **Step 1: 创建 knexfile.ts**

```typescript
import type { Knex } from 'knex'

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/drama_studio',
    migrations: {
      directory: './migrations',
      extension: 'ts',
    },
    seeds: {
      directory: './seeds',
      extension: 'ts',
    },
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './migrations',
      extension: 'ts',
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
}

export default config
```

- [ ] **Step 2: 创建 core/db.ts**

```typescript
import knex, { type Knex } from 'knex'

let instance: Knex | null = null

export function getDb(): Knex {
  if (!instance) {
    instance = knex({
      client: 'pg',
      connection: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/drama_studio',
      pool: { min: 0, max: 10 },
    })
  }
  return instance
}

export async function closeDb(): Promise<void> {
  if (instance) {
    await instance.destroy()
    instance = null
  }
}
```

- [ ] **Step 3: 确保 PostgreSQL 运行并创建数据库**

```bash
createdb drama_studio 2>/dev/null || echo "Database already exists"
```

- [ ] **Step 4: Commit**

```bash
git add knexfile.ts core/db.ts
git commit -m "feat: add Knex configuration and database connection"
```

---

### Task 3: 数据库迁移 — 全部表结构

**Files:**
- Create: `migrations/20260318000000_initial.ts`

- [ ] **Step 1: 创建迁移文件**

```typescript
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

  // users
  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.string('email').unique().notNullable()
    t.string('name').notNullable()
    t.string('avatar')
    t.string('password_hash').notNullable()
    t.timestamps(true, true)
  })

  // teams
  await knex.schema.createTable('teams', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.string('name').notNullable()
    t.text('description')
    t.uuid('created_by').references('id').inTable('users').onDelete('SET NULL')
    t.timestamps(true, true)
  })

  // team_members
  await knex.schema.createTable('team_members', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('team_id').references('id').inTable('teams').onDelete('CASCADE').notNullable()
    t.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable()
    t.enum('role', ['owner', 'editor', 'viewer']).defaultTo('editor').notNullable()
    t.timestamp('joined_at').defaultTo(knex.fn.now())
    t.unique(['team_id', 'user_id'])
  })

  // projects
  await knex.schema.createTable('projects', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('team_id').references('id').inTable('teams').onDelete('CASCADE').notNullable()
    t.string('title').notNullable()
    t.jsonb('genre').defaultTo('[]')
    t.string('audience')
    t.string('tone')
    t.string('ending_type')
    t.integer('total_episodes').defaultTo(60)
    t.string('language').defaultTo('zh-CN')
    t.string('mode').defaultTo('domestic')
    t.enum('status', ['draft', 'in_progress', 'review', 'completed']).defaultTo('draft')
    t.uuid('created_by').references('id').inTable('users').onDelete('SET NULL')
    t.timestamps(true, true)
  })

  // creative_plans
  await knex.schema.createTable('creative_plans', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE').unique().notNullable()
    t.jsonb('content').defaultTo('{}')
    t.integer('version').defaultTo(1)
    t.timestamps(true, true)
  })

  // characters
  await knex.schema.createTable('characters', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE').notNullable()
    t.string('name').notNullable()
    t.integer('age')
    t.text('appearance')
    t.jsonb('personality_tags').defaultTo('[]')
    t.string('public_identity')
    t.string('real_identity')
    t.text('motivation')
    t.text('conflict_point')
    t.string('catchphrase')
    t.text('arc_description')
    t.integer('villain_level')
    t.integer('sort_order').defaultTo(0)
    t.boolean('is_active').defaultTo(true)
    t.timestamps(true, true)
  })

  // character_relations
  await knex.schema.createTable('character_relations', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE').notNullable()
    t.uuid('from_character_id').references('id').inTable('characters').onDelete('CASCADE').notNullable()
    t.uuid('to_character_id').references('id').inTable('characters').onDelete('CASCADE').notNullable()
    t.string('relation_type').notNullable()
    t.text('description')
  })

  // scenes
  await knex.schema.createTable('scenes', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE').notNullable()
    t.string('name').notNullable()
    t.string('location_type')
    t.string('time_of_day')
    t.text('description')
    t.jsonb('tags').defaultTo('[]')
    t.boolean('is_active').defaultTo(true)
    t.timestamps(true, true)
  })

  // props
  await knex.schema.createTable('props', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE').notNullable()
    t.string('name').notNullable()
    t.text('description')
    t.jsonb('tags').defaultTo('[]')
    t.boolean('is_active').defaultTo(true)
    t.timestamps(true, true)
  })

  // episodes
  await knex.schema.createTable('episodes', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE').notNullable()
    t.integer('episode_number').notNullable()
    t.string('title')
    t.text('synopsis')
    t.string('hook_type')
    t.boolean('is_key_episode').defaultTo(false)
    t.boolean('is_paywall').defaultTo(false)
    t.integer('act')
    t.string('rhythm_phase')
    t.enum('status', ['planned', 'writing', 'written']).defaultTo('planned')
    t.boolean('is_active').defaultTo(true)
    t.timestamps(true, true)
    t.unique(['project_id', 'episode_number'])
  })

  // episode_scripts
  await knex.schema.createTable('episode_scripts', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('episode_id').references('id').inTable('episodes').onDelete('CASCADE').notNullable()
    t.text('content')
    t.integer('version').defaultTo(1)
    t.integer('word_count').defaultTo(0)
    t.uuid('created_by').references('id').inTable('users').onDelete('SET NULL')
    t.timestamp('created_at').defaultTo(knex.fn.now())
  })

  // storyboards
  await knex.schema.createTable('storyboards', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('episode_id').references('id').inTable('episodes').onDelete('CASCADE').notNullable()
    t.integer('sequence_number').notNullable()
    t.string('shot_type')
    t.uuid('scene_id').references('id').inTable('scenes').onDelete('SET NULL')
    t.text('description')
    t.text('dialogue')
    t.text('action_direction')
    t.text('music_cue')
    t.decimal('duration_seconds', 6, 2)
    t.boolean('is_active').defaultTo(true)
    t.timestamps(true, true)
  })

  // assets
  await knex.schema.createTable('assets', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE').notNullable()
    t.string('type').notNullable()
    t.string('category').notNullable()
    t.string('file_path').notNullable()
    t.string('file_name')
    t.bigInteger('file_size')
    t.string('mime_type')
    t.jsonb('metadata').defaultTo('{}')
    t.string('linked_entity_type')
    t.uuid('linked_entity_id')
    t.boolean('is_active').defaultTo(true)
    t.timestamp('created_at').defaultTo(knex.fn.now())
  })

  // entity_versions
  await knex.schema.createTable('entity_versions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.string('entity_type').notNullable()
    t.uuid('entity_id').notNullable()
    t.integer('version_number').notNullable()
    t.jsonb('snapshot').notNullable()
    t.text('change_summary')
    t.uuid('created_by').references('id').inTable('users').onDelete('SET NULL')
    t.timestamp('created_at').defaultTo(knex.fn.now())
    t.unique(['entity_type', 'entity_id', 'version_number'])
  })

  // indexes
  await knex.schema.raw('CREATE INDEX idx_assets_linked ON assets(linked_entity_type, linked_entity_id)')
  await knex.schema.raw('CREATE INDEX idx_entity_versions_entity ON entity_versions(entity_type, entity_id)')
  await knex.schema.raw('CREATE INDEX idx_projects_team ON projects(team_id)')
  await knex.schema.raw('CREATE INDEX idx_episodes_project ON episodes(project_id)')
  await knex.schema.raw('CREATE INDEX idx_characters_project ON characters(project_id)')
}

export async function down(knex: Knex): Promise<void> {
  const tables = [
    'entity_versions', 'assets', 'storyboards', 'episode_scripts',
    'episodes', 'props', 'scenes', 'character_relations', 'characters',
    'creative_plans', 'projects', 'team_members', 'teams', 'users',
  ]
  for (const table of tables) {
    await knex.schema.dropTableIfExists(table)
  }
}
```

- [ ] **Step 2: 运行迁移**

Knex CLI 不原生支持 TypeScript，需要通过 tsx 执行：

```bash
npx tsx node_modules/.bin/knex migrate:latest --knexfile knexfile.ts
```

如果上面命令有问题，备选方案：
```bash
npx knex migrate:latest --knexfile knexfile.ts --esm
```

Expected: 所有表创建成功

- [ ] **Step 3: 验证表结构**

```bash
psql drama_studio -c "\dt"
```

Expected: 列出所有 14 张表（users, teams, team_members, projects, creative_plans, characters, character_relations, scenes, props, episodes, episode_scripts, storyboards, assets, entity_versions）

- [ ] **Step 4: Commit**

```bash
git add migrations/
git commit -m "feat: add initial database migration with all tables"
```

---

## Chunk 2: 类型定义与核心模型

### Task 4: TypeScript 类型定义

**Files:**
- Create: `core/types/user.ts`
- Create: `core/types/team.ts`
- Create: `core/types/project.ts`
- Create: `core/types/character.ts`
- Create: `core/types/scene.ts`
- Create: `core/types/prop.ts`
- Create: `core/types/episode.ts`
- Create: `core/types/storyboard.ts`
- Create: `core/types/asset.ts`
- Create: `core/types/version.ts`
- Create: `core/types/index.ts`

- [ ] **Step 1: 创建 core/types/user.ts**

```typescript
export interface User {
  id: string
  email: string
  name: string
  avatar: string | null
  password_hash: string
  created_at: Date
  updated_at: Date
}

export type UserPublic = Omit<User, 'password_hash'>

export interface CreateUserInput {
  email: string
  name: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}
```

- [ ] **Step 2: 创建 core/types/team.ts**

```typescript
export interface Team {
  id: string
  name: string
  description: string | null
  created_by: string | null
  created_at: Date
  updated_at: Date
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: 'owner' | 'editor' | 'viewer'
  joined_at: Date
}

export interface CreateTeamInput {
  name: string
  description?: string
}

export interface AddMemberInput {
  user_id: string
  role?: 'editor' | 'viewer'
}

export interface TeamWithMembers extends Team {
  members: (TeamMember & { user_name: string; user_email: string })[]
}
```

- [ ] **Step 3: 创建 core/types/project.ts**

```typescript
export type ProjectStatus = 'draft' | 'in_progress' | 'review' | 'completed'

export interface Project {
  id: string
  team_id: string
  title: string
  genre: string[]
  audience: string | null
  tone: string | null
  ending_type: string | null
  total_episodes: number
  language: string
  mode: string
  status: ProjectStatus
  created_by: string | null
  created_at: Date
  updated_at: Date
}

export interface CreateProjectInput {
  team_id: string
  title: string
  genre?: string[]
  audience?: string
  tone?: string
  ending_type?: string
  total_episodes?: number
  language?: string
  mode?: string
}

export interface UpdateProjectInput {
  title?: string
  genre?: string[]
  audience?: string
  tone?: string
  ending_type?: string
  total_episodes?: number
  language?: string
  mode?: string
  status?: ProjectStatus
}
```

- [ ] **Step 4: 创建其余类型文件**

创建 `core/types/character.ts`:
```typescript
export interface Character {
  id: string
  project_id: string
  name: string
  age: number | null
  appearance: string | null
  personality_tags: string[]
  public_identity: string | null
  real_identity: string | null
  motivation: string | null
  conflict_point: string | null
  catchphrase: string | null
  arc_description: string | null
  villain_level: number | null
  sort_order: number
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface CharacterRelation {
  id: string
  project_id: string
  from_character_id: string
  to_character_id: string
  relation_type: string
  description: string | null
}

export interface CreateCharacterInput {
  name: string
  age?: number
  appearance?: string
  personality_tags?: string[]
  public_identity?: string
  real_identity?: string
  motivation?: string
  conflict_point?: string
  catchphrase?: string
  arc_description?: string
  villain_level?: number
  sort_order?: number
}
```

创建 `core/types/scene.ts`:
```typescript
export interface Scene {
  id: string
  project_id: string
  name: string
  location_type: string | null
  time_of_day: string | null
  description: string | null
  tags: string[]
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface CreateSceneInput {
  name: string
  location_type?: string
  time_of_day?: string
  description?: string
  tags?: string[]
}
```

创建 `core/types/prop.ts`:
```typescript
export interface Prop {
  id: string
  project_id: string
  name: string
  description: string | null
  tags: string[]
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface CreatePropInput {
  name: string
  description?: string
  tags?: string[]
}
```

创建 `core/types/episode.ts`:
```typescript
export type EpisodeStatus = 'planned' | 'writing' | 'written'

export interface Episode {
  id: string
  project_id: string
  episode_number: number
  title: string | null
  synopsis: string | null
  hook_type: string | null
  is_key_episode: boolean
  is_paywall: boolean
  act: number | null
  rhythm_phase: string | null
  status: EpisodeStatus
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface EpisodeScript {
  id: string
  episode_id: string
  content: string | null
  version: number
  word_count: number
  created_by: string | null
  created_at: Date
}

export interface CreateEpisodeInput {
  episode_number: number
  title?: string
  synopsis?: string
  hook_type?: string
  is_key_episode?: boolean
  is_paywall?: boolean
  act?: number
  rhythm_phase?: string
}
```

创建 `core/types/storyboard.ts`:
```typescript
export interface Storyboard {
  id: string
  episode_id: string
  sequence_number: number
  shot_type: string | null
  scene_id: string | null
  description: string | null
  dialogue: string | null
  action_direction: string | null
  music_cue: string | null
  duration_seconds: number | null
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface CreateStoryboardInput {
  sequence_number: number
  shot_type?: string
  scene_id?: string
  description?: string
  dialogue?: string
  action_direction?: string
  music_cue?: string
  duration_seconds?: number
}
```

创建 `core/types/asset.ts`:
```typescript
export interface Asset {
  id: string
  project_id: string
  type: 'image' | 'audio' | 'video'
  category: string
  file_path: string
  file_name: string | null
  file_size: number | null
  mime_type: string | null
  metadata: Record<string, unknown>
  linked_entity_type: string | null
  linked_entity_id: string | null
  is_active: boolean
  created_at: Date
}
```

创建 `core/types/version.ts`:
```typescript
export interface EntityVersion {
  id: string
  entity_type: string
  entity_id: string
  version_number: number
  snapshot: Record<string, unknown>
  change_summary: string | null
  created_by: string | null
  created_at: Date
}
```

创建 `core/types/index.ts`:
```typescript
export * from './user'
export * from './team'
export * from './project'
export * from './character'
export * from './scene'
export * from './prop'
export * from './episode'
export * from './storyboard'
export * from './asset'
export * from './version'
```

- [ ] **Step 5: Commit**

```bash
git add core/types/
git commit -m "feat: add TypeScript type definitions for all entities"
```

---

### Task 5: User Model

**Files:**
- Create: `core/models/user.model.ts`

- [ ] **Step 1: 创建 user.model.ts**

```typescript
import { getDb } from '../db'
import type { User, CreateUserInput } from '../types'

const TABLE = 'users'

export const UserModel = {
  async findById(id: string): Promise<User | undefined> {
    return getDb()(TABLE).where({ id }).first()
  },

  async findByEmail(email: string): Promise<User | undefined> {
    return getDb()(TABLE).where({ email }).first()
  },

  async create(input: Omit<CreateUserInput, 'password'> & { password_hash: string }): Promise<User> {
    const [user] = await getDb()(TABLE)
      .insert({
        email: input.email,
        name: input.name,
        password_hash: input.password_hash,
      })
      .returning('*')
    return user
  },

  async update(id: string, data: Partial<Pick<User, 'name' | 'avatar'>>): Promise<User | undefined> {
    const [user] = await getDb()(TABLE)
      .where({ id })
      .update({ ...data, updated_at: new Date() })
      .returning('*')
    return user
  },
}
```

- [ ] **Step 2: Commit**

```bash
git add core/models/user.model.ts
git commit -m "feat: add User model"
```

---

### Task 6: Team Model

**Files:**
- Create: `core/models/team.model.ts`

- [ ] **Step 1: 创建 team.model.ts**

```typescript
import { getDb } from '../db'
import type { Team, TeamMember, TeamWithMembers, CreateTeamInput, AddMemberInput } from '../types'

const TEAMS = 'teams'
const MEMBERS = 'team_members'

export const TeamModel = {
  async findById(id: string): Promise<Team | undefined> {
    return getDb()(TEAMS).where({ id }).first()
  },

  async findByUser(userId: string): Promise<Team[]> {
    return getDb()(TEAMS)
      .join(MEMBERS, `${TEAMS}.id`, `${MEMBERS}.team_id`)
      .where(`${MEMBERS}.user_id`, userId)
      .select(`${TEAMS}.*`)
  },

  async create(input: CreateTeamInput, userId: string): Promise<Team> {
    const db = getDb()
    return db.transaction(async (trx) => {
      const [team] = await trx(TEAMS)
        .insert({
          name: input.name,
          description: input.description || null,
          created_by: userId,
        })
        .returning('*')

      await trx(MEMBERS).insert({
        team_id: team.id,
        user_id: userId,
        role: 'owner',
      })

      return team
    })
  },

  async update(id: string, data: Partial<Pick<Team, 'name' | 'description'>>): Promise<Team | undefined> {
    const [team] = await getDb()(TEAMS)
      .where({ id })
      .update({ ...data, updated_at: new Date() })
      .returning('*')
    return team
  },

  async getMembers(teamId: string): Promise<(TeamMember & { user_name: string; user_email: string })[]> {
    return getDb()(MEMBERS)
      .join('users', `${MEMBERS}.user_id`, 'users.id')
      .where(`${MEMBERS}.team_id`, teamId)
      .select(`${MEMBERS}.*`, 'users.name as user_name', 'users.email as user_email')
  },

  async addMember(teamId: string, input: AddMemberInput): Promise<TeamMember> {
    const [member] = await getDb()(MEMBERS)
      .insert({
        team_id: teamId,
        user_id: input.user_id,
        role: input.role || 'editor',
      })
      .returning('*')
    return member
  },

  async isMember(teamId: string, userId: string): Promise<boolean> {
    const row = await getDb()(MEMBERS)
      .where({ team_id: teamId, user_id: userId })
      .first()
    return !!row
  },

  async getMemberRole(teamId: string, userId: string): Promise<string | null> {
    const row = await getDb()(MEMBERS)
      .where({ team_id: teamId, user_id: userId })
      .select('role')
      .first()
    return row?.role || null
  },
}
```

- [ ] **Step 2: Commit**

```bash
git add core/models/team.model.ts
git commit -m "feat: add Team model with member management"
```

---

### Task 7: Project Model (骨架)

**Files:**
- Create: `core/models/project.model.ts`

- [ ] **Step 1: 创建 project.model.ts**

```typescript
import { getDb } from '../db'
import type { Project, CreateProjectInput, UpdateProjectInput } from '../types'

const TABLE = 'projects'

export const ProjectModel = {
  async findById(id: string): Promise<Project | undefined> {
    return getDb()(TABLE).where({ id }).first()
  },

  async findByTeam(teamId: string): Promise<Project[]> {
    return getDb()(TABLE).where({ team_id: teamId }).orderBy('updated_at', 'desc')
  },

  async findByUser(userId: string): Promise<Project[]> {
    return getDb()(TABLE)
      .join('team_members', `${TABLE}.team_id`, 'team_members.team_id')
      .where('team_members.user_id', userId)
      .select(`${TABLE}.*`)
      .orderBy(`${TABLE}.updated_at`, 'desc')
  },

  async create(input: CreateProjectInput, userId: string): Promise<Project> {
    const [project] = await getDb()(TABLE)
      .insert({
        team_id: input.team_id,
        title: input.title,
        genre: JSON.stringify(input.genre || []),
        audience: input.audience || null,
        tone: input.tone || null,
        ending_type: input.ending_type || null,
        total_episodes: input.total_episodes || 60,
        language: input.language || 'zh-CN',
        mode: input.mode || 'domestic',
        created_by: userId,
      })
      .returning('*')
    return project
  },

  async update(id: string, data: UpdateProjectInput): Promise<Project | undefined> {
    const updateData: Record<string, unknown> = { updated_at: new Date() }
    if (data.title !== undefined) updateData.title = data.title
    if (data.genre !== undefined) updateData.genre = JSON.stringify(data.genre)
    if (data.audience !== undefined) updateData.audience = data.audience
    if (data.tone !== undefined) updateData.tone = data.tone
    if (data.ending_type !== undefined) updateData.ending_type = data.ending_type
    if (data.total_episodes !== undefined) updateData.total_episodes = data.total_episodes
    if (data.language !== undefined) updateData.language = data.language
    if (data.mode !== undefined) updateData.mode = data.mode
    if (data.status !== undefined) updateData.status = data.status

    const [project] = await getDb()(TABLE)
      .where({ id })
      .update(updateData)
      .returning('*')
    return project
  },

  async delete(id: string): Promise<boolean> {
    const count = await getDb()(TABLE).where({ id }).del()
    return count > 0
  },
}
```

- [ ] **Step 2: Commit**

```bash
git add core/models/project.model.ts
git commit -m "feat: add Project model"
```

---

## Chunk 3: 认证系统

### Task 8: JWT 工具函数

**Files:**
- Create: `server/utils/auth.ts`
- Create: `server/utils/response.ts`

- [ ] **Step 1: 创建 server/utils/auth.ts**

```typescript
import { SignJWT, jwtVerify } from 'jose'
import type { H3Event } from 'h3'

function getJwtSecret(): Uint8Array {
  const secret = useRuntimeConfig().jwtSecret || 'dev-secret'
  return new TextEncoder().encode(secret)
}

export async function signToken(payload: { userId: string }): Promise<string> {
  const config = useRuntimeConfig()
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(config.jwtExpiresIn || '7d')
    .setIssuedAt()
    .sign(getJwtSecret())
}

export async function verifyToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    return payload as unknown as { userId: string }
  } catch {
    return null
  }
}

export function getTokenFromEvent(event: H3Event): string | null {
  const auth = getHeader(event, 'authorization')
  if (auth?.startsWith('Bearer ')) {
    return auth.slice(7)
  }
  return getCookie(event, 'token') || null
}
```

- [ ] **Step 2: 创建 server/utils/response.ts**

```typescript
import { createError } from 'h3'

export function ok<T>(data: T) {
  return { success: true, data }
}

export function paginated<T>(data: T[], total: number, page: number, pageSize: number) {
  return {
    success: true,
    data,
    pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  }
}

export function unauthorized(message = '未授权') {
  throw createError({ statusCode: 401, statusMessage: message })
}

export function forbidden(message = '无权限') {
  throw createError({ statusCode: 403, statusMessage: message })
}

export function notFound(message = '未找到') {
  throw createError({ statusCode: 404, statusMessage: message })
}

export function badRequest(message = '请求参数错误') {
  throw createError({ statusCode: 400, statusMessage: message })
}
```

- [ ] **Step 3: Commit**

```bash
git add server/utils/
git commit -m "feat: add JWT auth utilities and response helpers"
```

---

### Task 9: Auth Service

**Files:**
- Create: `core/services/auth.service.ts`

- [ ] **Step 1: 创建 auth.service.ts**

```typescript
import { hash, compare } from 'bcryptjs'
import { UserModel } from '../models/user.model'
import type { CreateUserInput, LoginInput, UserPublic } from '../types'

function toPublic(user: { id: string; email: string; name: string; avatar: string | null; created_at: Date; updated_at: Date }): UserPublic {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    created_at: user.created_at,
    updated_at: user.updated_at,
  }
}

export const AuthService = {
  async register(input: CreateUserInput): Promise<UserPublic> {
    const existing = await UserModel.findByEmail(input.email)
    if (existing) {
      throw new Error('邮箱已被注册')
    }

    const password_hash = await hash(input.password, 12)
    const user = await UserModel.create({
      email: input.email,
      name: input.name,
      password_hash,
    })
    return toPublic(user)
  },

  async login(input: LoginInput): Promise<UserPublic> {
    const user = await UserModel.findByEmail(input.email)
    if (!user) {
      throw new Error('邮箱或密码错误')
    }

    const valid = await compare(input.password, user.password_hash)
    if (!valid) {
      throw new Error('邮箱或密码错误')
    }

    return toPublic(user)
  },

  async getUser(userId: string): Promise<UserPublic | null> {
    const user = await UserModel.findById(userId)
    return user ? toPublic(user) : null
  },
}
```

- [ ] **Step 2: Commit**

```bash
git add core/services/auth.service.ts
git commit -m "feat: add Auth service with register/login"
```

---

### Task 10: Auth API Routes

**Files:**
- Create: `server/api/auth/register.post.ts`
- Create: `server/api/auth/login.post.ts`
- Create: `server/api/auth/me.get.ts`
- Create: `server/middleware/auth.ts`

- [ ] **Step 1: 创建注册接口**

`server/api/auth/register.post.ts`:
```typescript
import { AuthService } from '~/core/services/auth.service'
import { signToken } from '~/server/utils/auth'
import { ok, badRequest } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.email || !body.name || !body.password) {
    badRequest('email, name, password 必填')
  }

  try {
    const user = await AuthService.register({
      email: body.email,
      name: body.name,
      password: body.password,
    })
    const token = await signToken({ userId: user.id })

    setCookie(event, 'token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return ok({ user, token })
  } catch (e: any) {
    badRequest(e.message)
  }
})
```

- [ ] **Step 2: 创建登录接口**

`server/api/auth/login.post.ts`:
```typescript
import { AuthService } from '~/core/services/auth.service'
import { signToken } from '~/server/utils/auth'
import { ok, badRequest } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.email || !body.password) {
    badRequest('email, password 必填')
  }

  try {
    const user = await AuthService.login({
      email: body.email,
      password: body.password,
    })
    const token = await signToken({ userId: user.id })

    setCookie(event, 'token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return ok({ user, token })
  } catch (e: any) {
    badRequest(e.message)
  }
})
```

- [ ] **Step 3: 创建当前用户接口**

`server/api/auth/me.get.ts`:
```typescript
import { AuthService } from '~/core/services/auth.service'
import { getTokenFromEvent, verifyToken } from '~/server/utils/auth'
import { ok, unauthorized } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const token = getTokenFromEvent(event)
  if (!token) unauthorized()

  const payload = await verifyToken(token!)
  if (!payload) unauthorized()

  const user = await AuthService.getUser(payload!.userId)
  if (!user) unauthorized()

  return ok(user)
})
```

- [ ] **Step 4: 创建服务端认证中间件**

`server/middleware/auth.ts`:
```typescript
import { getTokenFromEvent, verifyToken } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const path = url.pathname

  if (path.startsWith('/api/auth/')) return
  if (!path.startsWith('/api/')) return

  const token = getTokenFromEvent(event)
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: '未授权' })
  }

  const payload = await verifyToken(token)
  if (!payload) {
    throw createError({ statusCode: 401, statusMessage: 'Token 无效或已过期' })
  }

  event.context.userId = payload.userId
})
```

- [ ] **Step 5: Commit**

```bash
git add server/api/auth/ server/middleware/auth.ts
git commit -m "feat: add auth API routes and server middleware"
```

---

## Chunk 4: 团队 CRUD 与项目列表

### Task 11: Team Service

**Files:**
- Create: `core/services/team.service.ts`

- [ ] **Step 1: 创建 team.service.ts**

```typescript
import { TeamModel } from '../models/team.model'
import type { CreateTeamInput, AddMemberInput, Team, TeamMember } from '../types'

export const TeamService = {
  async getUserTeams(userId: string): Promise<Team[]> {
    return TeamModel.findByUser(userId)
  },

  async getTeam(teamId: string, userId: string): Promise<Team> {
    const isMember = await TeamModel.isMember(teamId, userId)
    if (!isMember) throw new Error('无权访问该团队')

    const team = await TeamModel.findById(teamId)
    if (!team) throw new Error('团队不存在')
    return team
  },

  async createTeam(input: CreateTeamInput, userId: string): Promise<Team> {
    return TeamModel.create(input, userId)
  },

  async updateTeam(teamId: string, data: Partial<Pick<Team, 'name' | 'description'>>, userId: string): Promise<Team> {
    const role = await TeamModel.getMemberRole(teamId, userId)
    if (role !== 'owner') throw new Error('仅团队所有者可修改团队信息')

    const team = await TeamModel.update(teamId, data)
    if (!team) throw new Error('团队不存在')
    return team
  },

  async getMembers(teamId: string, userId: string) {
    const isMember = await TeamModel.isMember(teamId, userId)
    if (!isMember) throw new Error('无权访问该团队')
    return TeamModel.getMembers(teamId)
  },

  async addMember(teamId: string, input: AddMemberInput, userId: string): Promise<TeamMember> {
    const role = await TeamModel.getMemberRole(teamId, userId)
    if (role !== 'owner') throw new Error('仅团队所有者可添加成员')
    return TeamModel.addMember(teamId, input)
  },
}
```

- [ ] **Step 2: Commit**

```bash
git add core/services/team.service.ts
git commit -m "feat: add Team service"
```

---

### Task 12: Team API Routes

**Files:**
- Create: `server/api/teams/index.get.ts`
- Create: `server/api/teams/index.post.ts`
- Create: `server/api/teams/[id]/index.get.ts`
- Create: `server/api/teams/[id]/index.put.ts`
- Create: `server/api/teams/[id]/members.get.ts`
- Create: `server/api/teams/[id]/members.post.ts`

- [ ] **Step 1: 创建团队列表和创建接口**

`server/api/teams/index.get.ts`:
```typescript
import { TeamService } from '~/core/services/team.service'
import { ok } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const teams = await TeamService.getUserTeams(userId)
  return ok(teams)
})
```

`server/api/teams/index.post.ts`:
```typescript
import { TeamService } from '~/core/services/team.service'
import { ok, badRequest } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const body = await readBody(event)

  if (!body.name) badRequest('name 必填')

  const team = await TeamService.createTeam(
    { name: body.name, description: body.description },
    userId,
  )
  return ok(team)
})
```

- [ ] **Step 2: 创建团队详情和更新接口**

`server/api/teams/[id]/index.get.ts`:
```typescript
import { TeamService } from '~/core/services/team.service'
import { ok } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const teamId = getRouterParam(event, 'id')!
  const team = await TeamService.getTeam(teamId, userId)
  return ok(team)
})
```

`server/api/teams/[id]/index.put.ts`:
```typescript
import { TeamService } from '~/core/services/team.service'
import { ok } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const teamId = getRouterParam(event, 'id')!
  const body = await readBody(event)

  const team = await TeamService.updateTeam(teamId, body, userId)
  return ok(team)
})
```

- [ ] **Step 3: 创建成员管理接口**

`server/api/teams/[id]/members.get.ts`:
```typescript
import { TeamService } from '~/core/services/team.service'
import { ok } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const teamId = getRouterParam(event, 'id')!
  const members = await TeamService.getMembers(teamId, userId)
  return ok(members)
})
```

`server/api/teams/[id]/members.post.ts`:
```typescript
import { TeamService } from '~/core/services/team.service'
import { ok, badRequest } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const teamId = getRouterParam(event, 'id')!
  const body = await readBody(event)

  if (!body.user_id) badRequest('user_id 必填')

  const member = await TeamService.addMember(teamId, body, userId)
  return ok(member)
})
```

- [ ] **Step 4: Commit**

```bash
git add server/api/teams/
git commit -m "feat: add Team API routes"
```

---

### Task 13: Project Service 骨架 + 项目列表/创建 API

**Files:**
- Create: `core/services/project.service.ts`
- Create: `server/api/projects/index.get.ts`
- Create: `server/api/projects/index.post.ts`

- [ ] **Step 1: 创建 project.service.ts**

```typescript
import { ProjectModel } from '../models/project.model'
import { TeamModel } from '../models/team.model'
import type { Project, CreateProjectInput, UpdateProjectInput } from '../types'

export const ProjectService = {
  async getUserProjects(userId: string): Promise<Project[]> {
    return ProjectModel.findByUser(userId)
  },

  async getProject(projectId: string, userId: string): Promise<Project> {
    const project = await ProjectModel.findById(projectId)
    if (!project) throw new Error('项目不存在')

    const isMember = await TeamModel.isMember(project.team_id, userId)
    if (!isMember) throw new Error('无权访问该项目')

    return project
  },

  async createProject(input: CreateProjectInput, userId: string): Promise<Project> {
    const isMember = await TeamModel.isMember(input.team_id, userId)
    if (!isMember) throw new Error('无权在该团队创建项目')

    return ProjectModel.create(input, userId)
  },

  async updateProject(projectId: string, data: UpdateProjectInput, userId: string): Promise<Project> {
    const project = await ProjectModel.findById(projectId)
    if (!project) throw new Error('项目不存在')

    const isMember = await TeamModel.isMember(project.team_id, userId)
    if (!isMember) throw new Error('无权修改该项目')

    const updated = await ProjectModel.update(projectId, data)
    if (!updated) throw new Error('更新失败')
    return updated
  },
}
```

- [ ] **Step 2: 创建项目 API**

`server/api/projects/index.get.ts`:
```typescript
import { ProjectService } from '~/core/services/project.service'
import { ok } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const projects = await ProjectService.getUserProjects(userId)
  return ok(projects)
})
```

`server/api/projects/index.post.ts`:
```typescript
import { ProjectService } from '~/core/services/project.service'
import { ok, badRequest } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const body = await readBody(event)

  if (!body.team_id || !body.title) badRequest('team_id, title 必填')

  const project = await ProjectService.createProject(body, userId)
  return ok(project)
})
```

- [ ] **Step 3: 创建项目详情和更新 API**

`server/api/projects/[id]/index.get.ts`:
```typescript
import { ProjectService } from '~/core/services/project.service'
import { ok } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const project = await ProjectService.getProject(projectId, userId)
  return ok(project)
})
```

`server/api/projects/[id]/index.put.ts`:
```typescript
import { ProjectService } from '~/core/services/project.service'
import { ok } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const body = await readBody(event)

  const project = await ProjectService.updateProject(projectId, body, userId)
  return ok(project)
})
```

- [ ] **Step 4: Commit**

```bash
git add core/services/project.service.ts server/api/projects/
git commit -m "feat: add Project service and API routes"
```

---

## Chunk 5: 前端基础 UI

### Task 14: 前端 Composables

**Files:**
- Create: `composables/useAuth.ts`
- Create: `composables/useApi.ts`

- [ ] **Step 1: 创建 useApi.ts**

```typescript
export function useApi() {
  const token = useCookie('token')

  async function $api<T>(url: string, options: Record<string, any> = {}): Promise<T> {
    const headers: Record<string, string> = {}
    if (token.value) {
      headers['Authorization'] = `Bearer ${token.value}`
    }

    const res = await $fetch<{ success: boolean; data: T }>(url, {
      ...options,
      headers: { ...headers, ...options.headers },
    })
    return res.data
  }

  return { $api }
}
```

- [ ] **Step 2: 创建 useAuth.ts**

```typescript
import type { UserPublic } from '~/core/types'

export function useAuth() {
  const user = useState<UserPublic | null>('auth-user', () => null)
  const token = useCookie('token')
  const { $api } = useApi()

  async function fetchUser() {
    if (!token.value) {
      user.value = null
      return
    }
    try {
      user.value = await $api<UserPublic>('/api/auth/me')
    } catch {
      user.value = null
      token.value = null
    }
  }

  async function login(email: string, password: string) {
    const res = await $fetch<{ success: boolean; data: { user: UserPublic; token: string } }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    token.value = res.data.token
    user.value = res.data.user
  }

  async function register(name: string, email: string, password: string) {
    const res = await $fetch<{ success: boolean; data: { user: UserPublic; token: string } }>('/api/auth/register', {
      method: 'POST',
      body: { name, email, password },
    })
    token.value = res.data.token
    user.value = res.data.user
  }

  function logout() {
    token.value = null
    user.value = null
    navigateTo('/login')
  }

  const isLoggedIn = computed(() => !!user.value)

  return { user, isLoggedIn, fetchUser, login, register, logout }
}
```

- [ ] **Step 3: Commit**

```bash
git add composables/
git commit -m "feat: add auth and API composables"
```

---

### Task 15: 前端路由守卫

**Files:**
- Create: `middleware/auth.global.ts`

- [ ] **Step 1: 创建路由守卫**

```typescript
export default defineNuxtRouteMiddleware(async (to) => {
  const { isLoggedIn, fetchUser } = useAuth()
  const publicPages = ['/login', '/register']

  if (!isLoggedIn.value) {
    await fetchUser()
  }

  if (!isLoggedIn.value && !publicPages.includes(to.path)) {
    return navigateTo('/login')
  }

  if (isLoggedIn.value && publicPages.includes(to.path)) {
    return navigateTo('/')
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add middleware/auth.global.ts
git commit -m "feat: add global auth route middleware"
```

---

### Task 16: 布局组件

**Files:**
- Create: `components/layout/AppSidebar.vue`
- Create: `components/layout/AppHeader.vue`
- Create: `components/layout/AppLayout.vue`
- Create: `app.vue`

- [ ] **Step 1: 创建 AppSidebar.vue**

```vue
<script setup lang="ts">
const collapsed = ref(false)
const route = useRoute()

const navItems = [
  { label: '仪表盘', icon: 'pi pi-home', to: '/' },
  { label: '项目', icon: 'pi pi-video', to: '/projects' },
  { label: '团队', icon: 'pi pi-users', to: '/teams' },
]
</script>

<template>
  <aside
    :class="[
      'h-screen bg-gray-900 text-white transition-all duration-300 flex flex-col',
      collapsed ? 'w-16' : 'w-60',
    ]"
  >
    <div class="flex items-center justify-between p-4 border-b border-gray-700">
      <span v-if="!collapsed" class="text-lg font-bold">Drama Studio</span>
      <Button
        :icon="collapsed ? 'pi pi-chevron-right' : 'pi pi-chevron-left'"
        text
        severity="secondary"
        size="small"
        class="!text-white"
        @click="collapsed = !collapsed"
      />
    </div>

    <nav class="flex-1 p-2 space-y-1">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :class="[
          'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
          route.path === item.to || route.path.startsWith(item.to + '/')
            ? 'bg-gray-700 text-white'
            : 'text-gray-400 hover:text-white hover:bg-gray-800',
        ]"
      >
        <i :class="[item.icon, 'text-sm']" />
        <span v-if="!collapsed">{{ item.label }}</span>
      </NuxtLink>
    </nav>
  </aside>
</template>
```

- [ ] **Step 2: 创建 AppHeader.vue**

```vue
<script setup lang="ts">
const { user, logout } = useAuth()
</script>

<template>
  <header class="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
    <div>
      <h1 class="text-lg font-semibold text-gray-800">
        <slot name="title">Drama Studio</slot>
      </h1>
    </div>

    <div class="flex items-center gap-4">
      <span class="text-sm text-gray-600">{{ user?.name }}</span>
      <Button label="退出" text severity="secondary" size="small" @click="logout" />
    </div>
  </header>
</template>
```

- [ ] **Step 3: 创建 AppLayout.vue**

```vue
<template>
  <div class="flex h-screen bg-gray-50">
    <LayoutAppSidebar />
    <div class="flex-1 flex flex-col overflow-hidden">
      <LayoutAppHeader>
        <template #title>
          <slot name="title" />
        </template>
      </LayoutAppHeader>
      <main class="flex-1 overflow-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
```

- [ ] **Step 4: 创建 app.vue**

```vue
<template>
  <NuxtPage />
</template>
```

- [ ] **Step 5: Commit**

```bash
git add components/layout/ app.vue
git commit -m "feat: add layout components (sidebar, header, layout wrapper)"
```

---

### Task 17: 登录/注册页

**Files:**
- Create: `pages/login.vue`
- Create: `pages/register.vue`

- [ ] **Step 1: 创建 login.vue**

```vue
<script setup lang="ts">
definePageMeta({ layout: false })

const { login } = useAuth()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await login(email.value, password.value)
    navigateTo('/')
  } catch (e: any) {
    error.value = e.data?.statusMessage || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <Card class="w-full max-w-md">
      <template #title>
        <h2 class="text-2xl font-bold text-center">Drama Studio</h2>
      </template>
      <template #subtitle>
        <p class="text-center">登录到你的账户</p>
      </template>
      <template #content>
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div class="flex flex-col gap-2">
            <label for="email">邮箱</label>
            <InputText id="email" v-model="email" type="email" placeholder="your@email.com" required class="w-full" />
          </div>

          <div class="flex flex-col gap-2">
            <label for="password">密码</label>
            <Password id="password" v-model="password" placeholder="输入密码" :feedback="false" toggleMask class="w-full" inputClass="w-full" />
          </div>

          <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

          <Button type="submit" label="登录" :loading="loading" class="w-full" />
        </form>
      </template>
      <template #footer>
        <p class="text-center text-sm text-gray-500">
          还没有账户？
          <NuxtLink to="/register" class="text-primary-500 hover:underline">注册</NuxtLink>
        </p>
      </template>
    </Card>
  </div>
</template>
```

- [ ] **Step 2: 创建 register.vue**

```vue
<script setup lang="ts">
definePageMeta({ layout: false })

const { register } = useAuth()
const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleRegister() {
  error.value = ''
  loading.value = true
  try {
    await register(name.value, email.value, password.value)
    navigateTo('/')
  } catch (e: any) {
    error.value = e.data?.statusMessage || '注册失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <Card class="w-full max-w-md">
      <template #title>
        <h2 class="text-2xl font-bold text-center">创建账户</h2>
      </template>
      <template #subtitle>
        <p class="text-center">开始你的短剧创作之旅</p>
      </template>
      <template #content>
        <form @submit.prevent="handleRegister" class="space-y-4">
          <div class="flex flex-col gap-2">
            <label for="name">名称</label>
            <InputText id="name" v-model="name" placeholder="你的名字" required class="w-full" />
          </div>

          <div class="flex flex-col gap-2">
            <label for="email">邮箱</label>
            <InputText id="email" v-model="email" type="email" placeholder="your@email.com" required class="w-full" />
          </div>

          <div class="flex flex-col gap-2">
            <label for="password">密码</label>
            <Password id="password" v-model="password" placeholder="至少 6 个字符" toggleMask class="w-full" inputClass="w-full" />
          </div>

          <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

          <Button type="submit" label="注册" :loading="loading" class="w-full" />
        </form>
      </template>
      <template #footer>
        <p class="text-center text-sm text-gray-500">
          已有账户？
          <NuxtLink to="/login" class="text-primary-500 hover:underline">登录</NuxtLink>
        </p>
      </template>
    </Card>
  </div>
</template>
```

- [ ] **Step 3: Commit**

```bash
git add pages/login.vue pages/register.vue
git commit -m "feat: add login and register pages"
```

---

### Task 18: 仪表盘页面

**Files:**
- Create: `pages/index.vue`

- [ ] **Step 1: 创建仪表盘**

```vue
<script setup lang="ts">
const { $api } = useApi()
const { user } = useAuth()

const { data: projects } = useAsyncData('dashboard-projects', () =>
  $api<any[]>('/api/projects'),
)

const { data: teams } = useAsyncData('dashboard-teams', () =>
  $api<any[]>('/api/teams'),
)
</script>

<template>
  <LayoutAppLayout>
    <template #title>仪表盘</template>

    <div class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <template #content>
            <div class="text-center">
              <p class="text-3xl font-bold">{{ projects?.length || 0 }}</p>
              <p class="text-gray-500 text-sm">项目总数</p>
            </div>
          </template>
        </Card>
        <Card>
          <template #content>
            <div class="text-center">
              <p class="text-3xl font-bold">{{ teams?.length || 0 }}</p>
              <p class="text-gray-500 text-sm">团队数</p>
            </div>
          </template>
        </Card>
        <Card>
          <template #content>
            <div class="text-center">
              <p class="text-3xl font-bold">{{ user?.name }}</p>
              <p class="text-gray-500 text-sm">欢迎回来</p>
            </div>
          </template>
        </Card>
      </div>

      <Card>
        <template #title>
          <div class="flex items-center justify-between">
            <span>最近项目</span>
            <NuxtLink to="/projects">
              <Button label="查看全部" text size="small" />
            </NuxtLink>
          </div>
        </template>
        <template #content>
          <div v-if="projects?.length" class="space-y-3">
            <div
              v-for="project in projects.slice(0, 5)"
              :key="project.id"
              class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <div>
                <p class="font-medium">{{ project.title }}</p>
                <p class="text-sm text-gray-500">{{ (project.genre || []).join(' · ') }}</p>
              </div>
              <Tag :severity="project.status === 'completed' ? 'success' : 'warn'" :value="project.status" />
            </div>
          </div>
          <p v-else class="text-gray-400 text-center py-8">暂无项目，去创建第一个吧</p>
        </template>
      </Card>
    </div>
  </LayoutAppLayout>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add pages/index.vue
git commit -m "feat: add dashboard page"
```

---

### Task 19: 开发种子数据

**Files:**
- Create: `seeds/01_dev_seed.ts`

- [ ] **Step 1: 创建种子数据**

```typescript
import type { Knex } from 'knex'
import { hash } from 'bcryptjs'

export async function seed(knex: Knex): Promise<void> {
  await knex('team_members').del()
  await knex('projects').del()
  await knex('teams').del()
  await knex('users').del()

  const passwordHash = await hash('password123', 12)

  const [user] = await knex('users')
    .insert({
      email: 'demo@drama.studio',
      name: '演示用户',
      password_hash: passwordHash,
    })
    .returning('*')

  const [team] = await knex('teams')
    .insert({
      name: '演示工作室',
      description: '这是一个演示团队',
      created_by: user.id,
    })
    .returning('*')

  await knex('team_members').insert({
    team_id: team.id,
    user_id: user.id,
    role: 'owner',
  })

  await knex('projects').insert({
    team_id: team.id,
    title: '偏偏宠你入骨',
    genre: JSON.stringify(['霸道总裁', '甜宠']),
    audience: '女频',
    tone: '甜虐',
    ending_type: 'HE',
    total_episodes: 60,
    language: 'zh-CN',
    mode: 'domestic',
    status: 'in_progress',
    created_by: user.id,
  })
}
```

- [ ] **Step 2: 运行种子数据**

```bash
npx tsx node_modules/.bin/knex seed:run --knexfile knexfile.ts
```

Expected: 种子数据插入成功

- [ ] **Step 3: Commit**

```bash
git add seeds/
git commit -m "feat: add development seed data"
```

---

### Task 20: 最终验证

- [ ] **Step 1: 确保所有依赖安装**

```bash
npm install
```

- [ ] **Step 2: 确保数据库已迁移和有种子数据**

```bash
npx tsx node_modules/.bin/knex migrate:latest --knexfile knexfile.ts
npx tsx node_modules/.bin/knex seed:run --knexfile knexfile.ts
```

- [ ] **Step 3: 启动开发服务器**

```bash
npm run dev
```

- [ ] **Step 4: 验证功能**

1. 访问 http://localhost:3000 → 应重定向到 /login
2. 注册新用户 → 成功后跳转到仪表盘
3. 仪表盘显示统计卡片
4. 使用演示账户登录: demo@drama.studio / password123

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: complete Phase 1 foundation setup"
```

---

## Summary

Phase 1 完成后，你将拥有：
- 完整的 14 张表数据库
- User/Team/Project 的 Core Service + Model
- JWT 认证系统
- 团队 CRUD API
- 项目列表/创建 API
- 登录/注册页面
- 仪表盘页面
- 侧边栏 + Header 布局

Phase 2 将在此基础上实现核心资源管理（角色、场景、分集、剧本编辑器等）。
