# Project Quality Improvements Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve code quality, UX, security, and developer experience across the entire Drama Studio project after Nuxt 4 upgrade.

**Architecture:** Ten independent improvement areas organized into 4 priority chunks. Each chunk can be executed independently. Changes focus on existing patterns — no major refactoring, just filling gaps.

**Tech Stack:** Nuxt 4.4.2, Vue 3.5.30, TypeScript, Zod (new), Vitest + @nuxt/test-utils (new), @nuxt/image (new)

---

## Chunk 1: Error Handling & UX Polish (High Priority)

### Task 1: Custom Error Page

**Files:**
- Create: `app/error.vue`

- [ ] **Step 1: Create `app/error.vue`**

```vue
<script setup lang="ts">
import { ArrowLeft, Home, RefreshCcw } from 'lucide-vue-next'

const props = defineProps<{
  error: {
    statusCode: number
    statusMessage?: string
    message?: string
  }
}>()

const title = computed(() => {
  switch (props.error.statusCode) {
    case 404: return '页面不存在'
    case 403: return '无权访问'
    case 500: return '服务器错误'
    default: return '出错了'
  }
})

const description = computed(() => {
  return props.error.statusMessage || props.error.message || '请稍后再试'
})

function handleError() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-zinc-50">
    <div class="text-center max-w-md mx-auto px-6">
      <div class="text-7xl font-bold text-zinc-200 mb-4">{{ error.statusCode }}</div>
      <h1 class="text-xl font-semibold text-zinc-900 mb-2">{{ title }}</h1>
      <p class="text-sm text-zinc-500 mb-8">{{ description }}</p>
      <div class="flex items-center justify-center gap-3">
        <button
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
          @click="handleError"
        >
          <Home class="h-4 w-4" />
          返回首页
        </button>
        <button
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
          @click="$router.back()"
        >
          <ArrowLeft class="h-4 w-4" />
          返回上页
        </button>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Verify error page works**

Navigate to http://localhost:3000/nonexistent-route and confirm the 404 error page renders correctly.

- [ ] **Step 3: Commit**

```bash
git add app/error.vue
git commit -m "feat: add custom error page with 404/403/500 handling"
```

---

### Task 2: Loading & Error States Component

**Files:**
- Create: `app/components/common/PageLoading.vue`
- Create: `app/components/common/PageError.vue`

- [ ] **Step 1: Create `PageLoading.vue`**

```vue
<script setup lang="ts">
defineProps<{
  text?: string
}>()
</script>

<template>
  <div class="flex items-center justify-center py-24">
    <div class="text-center">
      <div class="h-8 w-8 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin mx-auto mb-3" />
      <p class="text-sm text-zinc-500">{{ text || '加载中...' }}</p>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Create `PageError.vue`**

```vue
<script setup lang="ts">
import { AlertCircle, RefreshCcw } from 'lucide-vue-next'

defineProps<{
  error: Error | null
  retryFn?: () => void
}>()
</script>

<template>
  <div class="flex items-center justify-center py-16">
    <div class="text-center max-w-sm">
      <AlertCircle class="h-8 w-8 text-red-400 mx-auto mb-3" />
      <h3 class="text-sm font-medium text-zinc-900 mb-1">加载失败</h3>
      <p class="text-xs text-zinc-500 mb-4">{{ error?.message || '请稍后再试' }}</p>
      <button
        v-if="retryFn"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
        @click="retryFn"
      >
        <RefreshCcw class="h-3 w-3" />
        重试
      </button>
    </div>
  </div>
</template>
```

- [ ] **Step 3: Commit**

```bash
git add app/components/common/
git commit -m "feat: add PageLoading and PageError reusable components"
```

---

### Task 3: Add Loading/Error States to All Pages

**Files:**
- Modify: `app/pages/index.vue`
- Modify: `app/pages/projects/[id]/index.vue`
- Modify: `app/pages/projects/[id]/characters.vue`
- Modify: `app/pages/projects/[id]/scenes.vue`
- Modify: `app/pages/projects/[id]/episodes/index.vue`
- Modify: `app/pages/projects/[id]/episodes/[num]/storyboards.vue`
- Modify: `app/pages/projects/[id]/episodes/[num]/script.vue`
- Modify: `app/pages/projects/[id]/assets.vue`
- Modify: `app/pages/teams/index.vue`

**Pattern for each page:**

For every `useAsyncData` call, destructure `status` and `error`:

```typescript
const { data: project, status: projectStatus, error: projectError, refresh } = useAsyncData(...)
```

Then in the template, wrap the content:

```vue
<CommonPageLoading v-if="projectStatus === 'pending'" />
<CommonPageError v-else-if="projectError" :error="projectError" :retry-fn="refresh" />
<template v-else>
  <!-- existing content -->
</template>
```

- [ ] **Step 1: Update `app/pages/index.vue`**

Add `status` and `error` destructuring for `projects` and `teams` data. Wrap template with loading/error guards.

- [ ] **Step 2: Update `app/pages/projects/[id]/index.vue`**

Add loading/error for `project`, `characters`, `episodes`, `scenes` data.

- [ ] **Step 3: Update `app/pages/projects/[id]/characters.vue`**

Add loading/error for `project`, `characters`, `relations` data.

- [ ] **Step 4: Update `app/pages/projects/[id]/scenes.vue`**

Add loading/error for `project`, `scenes`, `propsList` data.

- [ ] **Step 5: Update `app/pages/projects/[id]/episodes/index.vue`**

Add loading/error for `project`, `episodes` data.

- [ ] **Step 6: Update `app/pages/projects/[id]/episodes/[num]/storyboards.vue`**

Add loading/error for `project`, `storyboards`, `scenes` data.

- [ ] **Step 7: Update `app/pages/projects/[id]/episodes/[num]/script.vue`**

Add loading/error for `project`, `episode`, `scriptData` data.

- [ ] **Step 8: Update `app/pages/projects/[id]/assets.vue`**

Add loading/error for `project`, `assets` data.

- [ ] **Step 9: Update `app/pages/teams/index.vue`**

Add loading/error for `teams` data.

- [ ] **Step 10: Verify all pages show loading spinner then content**

Navigate through all pages and confirm: loading spinner appears briefly, then content renders. Force errors by disconnecting DB and verify error state renders with retry button.

- [ ] **Step 11: Commit**

```bash
git add app/pages/
git commit -m "feat: add loading and error states to all pages"
```

---

## Chunk 2: Security & Validation (High Priority)

### Task 4: Environment Variable Validation

**Files:**
- Create: `server/plugins/validate-env.ts`

- [ ] **Step 1: Create env validation plugin**

```typescript
export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()

  const required: Record<string, string> = {
    databaseUrl: config.databaseUrl,
    jwtSecret: config.jwtSecret,
  }

  const missing: string[] = []
  for (const [key, value] of Object.entries(required)) {
    if (!value || value === 'dev-secret') {
      if (process.env.NODE_ENV === 'production') {
        missing.push(key)
      }
    }
  }

  if (missing.length > 0) {
    console.error(`[FATAL] Missing required environment variables: ${missing.join(', ')}`)
    console.error('Set these in .env or environment before starting production server.')
    process.exit(1)
  }
})
```

- [ ] **Step 2: Verify dev server still starts** (dev-secret is allowed in dev)

Run: `pnpm dev` — should start without errors.

- [ ] **Step 3: Commit**

```bash
git add server/plugins/validate-env.ts
git commit -m "feat: add environment variable validation for production"
```

---

### Task 5: API Input Validation with Zod

**Files:**
- Install: `zod` package
- Create: `server/utils/validate.ts`
- Create: `server/schemas/project.ts`
- Create: `server/schemas/character.ts`
- Create: `server/schemas/episode.ts`
- Create: `server/schemas/scene.ts`
- Create: `server/schemas/prop.ts`
- Create: `server/schemas/storyboard.ts`
- Create: `server/schemas/team.ts`
- Modify: all POST/PUT API handlers

- [ ] **Step 1: Install Zod**

```bash
pnpm add zod
```

- [ ] **Step 2: Create validation utility `server/utils/validate.ts`**

```typescript
import type { ZodSchema, ZodError } from 'zod'
import type { H3Event } from 'h3'

export async function validateBody<T>(event: H3Event, schema: ZodSchema<T>): Promise<T> {
  const body = await readBody(event)
  const result = schema.safeParse(body)
  if (!result.success) {
    const messages = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ')
    throw createError({ statusCode: 400, statusMessage: messages })
  }
  return result.data
}
```

- [ ] **Step 3: Create `server/schemas/project.ts`**

```typescript
import { z } from 'zod'

export const createProjectSchema = z.object({
  team_id: z.string().uuid(),
  title: z.string().min(1, '标题必填').max(200),
  genre: z.array(z.string()).optional(),
  audience: z.string().max(500).optional(),
  tone: z.string().max(100).optional(),
  ending_type: z.string().max(50).optional(),
  total_episodes: z.number().int().min(1).max(9999).optional(),
  language: z.string().max(10).optional(),
  mode: z.string().max(50).optional(),
})

export const updateProjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  genre: z.array(z.string()).optional(),
  audience: z.string().max(500).optional(),
  tone: z.string().max(100).optional(),
  ending_type: z.string().max(50).optional(),
  total_episodes: z.number().int().min(1).max(9999).optional(),
  language: z.string().max(10).optional(),
  mode: z.string().max(50).optional(),
  status: z.enum(['draft', 'in_progress', 'review', 'completed']).optional(),
})
```

- [ ] **Step 4: Create `server/schemas/character.ts`**

```typescript
import { z } from 'zod'

export const createCharacterSchema = z.object({
  name: z.string().min(1, '角色名必填').max(100),
  age: z.number().int().min(0).max(200).optional().nullable(),
  appearance: z.string().max(2000).optional(),
  personality_tags: z.array(z.string().max(50)).max(20).optional(),
  public_identity: z.string().max(200).optional(),
  real_identity: z.string().max(200).optional(),
  motivation: z.string().max(2000).optional(),
  conflict_point: z.string().max(2000).optional(),
  catchphrase: z.string().max(500).optional(),
  arc_description: z.string().max(2000).optional(),
  villain_level: z.number().int().min(0).max(10).optional().nullable(),
  image_prompt: z.string().max(5000).optional(),
  sort_order: z.number().int().optional(),
})

export const updateCharacterSchema = createCharacterSchema.partial()

export const characterRelationSchema = z.object({
  from_character_id: z.string().uuid(),
  to_character_id: z.string().uuid(),
  relation_type: z.string().min(1, '关系类型必填').max(50),
  description: z.string().max(500).optional(),
})
```

- [ ] **Step 5: Create `server/schemas/episode.ts`**

```typescript
import { z } from 'zod'

export const createEpisodeSchema = z.object({
  episode_number: z.number().int().min(1, '集数必填'),
  title: z.string().max(200).optional(),
  synopsis: z.string().max(5000).optional(),
  hook_type: z.string().max(100).optional(),
  is_key_episode: z.boolean().optional(),
  is_paywall: z.boolean().optional(),
  act: z.number().int().min(1).max(10).optional().nullable(),
  rhythm_phase: z.string().max(50).optional(),
})

export const updateEpisodeSchema = createEpisodeSchema.partial().extend({
  status: z.enum(['planned', 'writing', 'written']).optional(),
})
```

- [ ] **Step 6: Create `server/schemas/scene.ts`**

```typescript
import { z } from 'zod'

export const createSceneSchema = z.object({
  name: z.string().min(1, '场景名必填').max(100),
  location_type: z.string().max(50).optional(),
  time_of_day: z.string().max(50).optional(),
  description: z.string().max(5000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  image_prompt: z.string().max(5000).optional(),
})

export const updateSceneSchema = createSceneSchema.partial()
```

- [ ] **Step 7: Create `server/schemas/prop.ts`**

```typescript
import { z } from 'zod'

export const createPropSchema = z.object({
  name: z.string().min(1, '道具名必填').max(100),
  description: z.string().max(5000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  image_prompt: z.string().max(5000).optional(),
})

export const updatePropSchema = createPropSchema.partial()
```

- [ ] **Step 8: Create `server/schemas/storyboard.ts`**

```typescript
import { z } from 'zod'

export const createStoryboardSchema = z.object({
  scene_id: z.string().uuid().optional().nullable(),
  sequence_number: z.number().int().min(1).optional(),
  shot_type: z.string().max(50).optional(),
  camera_angle: z.string().max(50).optional(),
  camera_movement: z.string().max(100).optional(),
  transition_type: z.string().max(50).optional(),
  description: z.string().max(5000).optional(),
  dialogue: z.string().max(5000).optional(),
  sound_effects: z.string().max(1000).optional(),
  duration_seconds: z.number().min(0).max(3600).optional().nullable(),
  reference_image_url: z.string().url().max(2000).optional().nullable(),
  image_prompt: z.string().max(5000).optional(),
  notes: z.string().max(5000).optional(),
})

export const updateStoryboardSchema = createStoryboardSchema.partial()

export const reorderStoryboardsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
})
```

- [ ] **Step 9: Create `server/schemas/team.ts`**

```typescript
import { z } from 'zod'

export const createTeamSchema = z.object({
  name: z.string().min(1, '团队名必填').max(100),
  description: z.string().max(1000).optional(),
})

export const updateTeamSchema = createTeamSchema.partial()

export const addMemberSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(['editor', 'viewer']).optional(),
})
```

- [ ] **Step 10: Update POST/PUT handlers to use `validateBody`**

For each API handler, replace:
```typescript
const body = await readBody(event)
if (!body.name) badRequest('name 必填')
```

With:
```typescript
const body = await validateBody(event, createCharacterSchema)
```

**Files to update (POST):**
- `server/api/projects/index.post.ts` → `createProjectSchema`
- `server/api/projects/[id]/characters/index.post.ts` → `createCharacterSchema`
- `server/api/projects/[id]/scenes/index.post.ts` → `createSceneSchema`
- `server/api/projects/[id]/props/index.post.ts` → `createPropSchema`
- `server/api/projects/[id]/episodes/index.post.ts` → `createEpisodeSchema`
- `server/api/projects/[id]/episodes/[num]/storyboards/index.post.ts` → `createStoryboardSchema`
- `server/api/projects/[id]/episodes/[num]/scripts/index.post.ts` → (script schema)
- `server/api/teams/index.post.ts` → `createTeamSchema`
- `server/api/teams/[id]/members.post.ts` → `addMemberSchema`

**Files to update (PUT):**
- `server/api/projects/[id]/index.put.ts` → `updateProjectSchema`
- `server/api/projects/[id]/characters/[cid]/index.put.ts` → `updateCharacterSchema`
- `server/api/projects/[id]/scenes/[sid]/index.put.ts` → `updateSceneSchema`
- `server/api/projects/[id]/props/[pid]/index.put.ts` → `updatePropSchema`
- `server/api/projects/[id]/episodes/[num]/index.put.ts` → `updateEpisodeSchema`
- `server/api/projects/[id]/episodes/[num]/storyboards/[sid]/index.put.ts` → `updateStoryboardSchema`
- `server/api/projects/[id]/episodes/[num]/storyboards/reorder.put.ts` → `reorderStoryboardsSchema`
- `server/api/teams/[id]/index.put.ts` → `updateTeamSchema`
- `server/api/projects/[id]/character-relations/index.put.ts` → `characterRelationSchema`
- `server/api/projects/[id]/plan/index.put.ts` → (plan schema)
- `server/api/projects/[id]/entity-assets/link.put.ts` → (link schema)

- [ ] **Step 11: Test with invalid input to confirm validation**

```bash
# Should return 400 with field-specific errors
curl -s http://localhost:3000/api/auth/login -X POST -H 'Content-Type: application/json' -d '{"email":"demo@drama.studio","password":"password123"}' | python3 -c "import sys,json; t=json.load(sys.stdin)['data']['token']; print(t)" > /tmp/token.txt
TOKEN=$(cat /tmp/token.txt)

curl -s http://localhost:3000/api/projects -X POST -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"title":""}' | python3 -c "import sys,json; print(json.load(sys.stdin))"
```

Expected: 400 error mentioning "标题必填" and "team_id" required.

- [ ] **Step 12: Commit**

```bash
git add server/schemas/ server/utils/validate.ts server/api/ package.json pnpm-lock.yaml
git commit -m "feat: add Zod schema validation for all API endpoints"
```

---

## Chunk 3: TypeScript & SEO (Medium Priority)

### Task 6: Replace `any` Types in Pages

**Files:**
- Modify: `app/pages/projects/[id]/characters.vue`
- Modify: `app/pages/projects/[id]/scenes.vue`
- Modify: `app/pages/projects/[id]/episodes/index.vue`
- Modify: `app/pages/projects/[id]/episodes/[num]/storyboards.vue`
- Modify: `app/pages/projects/[id]/episodes/[num]/script.vue`
- Modify: `app/pages/projects/[id]/index.vue`
- Modify: `app/pages/projects/[id]/assets.vue`
- Modify: `app/pages/projects/[id]/plan.vue`
- Modify: `app/pages/projects/index.vue`
- Modify: `app/pages/index.vue`
- Modify: `app/pages/teams/index.vue`
- Modify: `app/components/project/CreateProjectDialog.vue`
- Modify: `app/components/project/EditProjectDialog.vue`
- Modify: `app/components/project/AssetUploadZone.vue`
- Modify: `app/components/project/EntityImageGallery.vue`

**Pattern:**

Replace:
```typescript
const { data: project } = useAsyncData(`project-${projectId}`, () => $api<any>(`/api/projects/${projectId}`))
```

With:
```typescript
import type { Project } from '~/core/types'
const { data: project } = useAsyncData(`project-${projectId}`, () => $api<Project>(`/api/projects/${projectId}`))
```

Replace:
```typescript
const editingScene = ref<any>(null)
function openSceneEdit(s: any) {
```

With:
```typescript
import type { Scene } from '~/core/types'
const editingScene = ref<Scene | null>(null)
function openSceneEdit(s: Scene) {
```

**Type mapping for `$api<T>` calls:**

| API Path | Type |
|----------|------|
| `/api/projects/${id}` | `Project` |
| `/api/projects/${id}/characters` | `Character[]` |
| `/api/projects/${id}/character-relations` | `CharacterRelation[]` |
| `/api/projects/${id}/scenes` | `Scene[]` |
| `/api/projects/${id}/props` | `Prop[]` |
| `/api/projects/${id}/episodes` | `Episode[]` |
| `/api/projects/${id}/episodes/${num}/storyboards` | `Storyboard[]` |
| `/api/projects/${id}/assets` | `Asset[]` |
| `/api/teams` | `Team[]` |

**Ref type mapping:**

| Variable | Type |
|----------|------|
| `editingScene` | `Scene \| null` |
| `editingProp` | `Prop \| null` |
| `editing` (episode) | `Episode \| null` |
| `editing` (team) | `Team \| null` |

**Catch blocks:**

Replace `catch (e: any)` with `catch (e: unknown)` and use:
```typescript
catch (e: unknown) {
  error.value = e instanceof Error ? e.message : '操作失败'
}
```

- [ ] **Step 1-11: Update each file** (one per step, following the pattern above)

- [ ] **Step 12: Verify no TypeScript errors**

```bash
npx nuxt typecheck
```

- [ ] **Step 13: Commit**

```bash
git add app/pages/ app/components/
git commit -m "refactor: replace any types with proper interfaces across all pages"
```

---

### Task 7: SEO & Meta Configuration

**Files:**
- Modify: `nuxt.config.ts`
- Modify: `app/pages/projects/[id]/index.vue`
- Modify: `app/pages/projects/[id]/characters.vue`
- Modify: `app/pages/projects/[id]/scenes.vue`
- Modify: `app/pages/projects/[id]/episodes/index.vue`
- Modify: `app/pages/projects/[id]/plan.vue`
- Modify: `app/pages/index.vue`
- Modify: `app/pages/projects/index.vue`
- Modify: `app/pages/teams/index.vue`

- [ ] **Step 1: Add default head config in `nuxt.config.ts`**

Add to `app.head`:
```typescript
title: 'Drama Studio',
meta: [
  { name: 'description', content: 'AI短剧创作管理平台' },
  { name: 'viewport', content: 'width=device-width, initial-scale=1' },
],
htmlAttrs: { lang: 'zh-CN' },
```

- [ ] **Step 2: Add `useHead()` to key pages**

Pattern:
```typescript
useHead({
  title: computed(() => project.value ? `${project.value.title} - 角色` : '角色管理'),
})
```

Pages to update:
- `index.vue` → title: "仪表盘 - Drama Studio"
- `projects/index.vue` → title: "项目列表 - Drama Studio"
- `projects/[id]/index.vue` → title: `${project.title} - 概览`
- `projects/[id]/characters.vue` → title: `${project.title} - 角色`
- `projects/[id]/scenes.vue` → title: `${project.title} - 场景与道具`
- `projects/[id]/episodes/index.vue` → title: `${project.title} - 分集`
- `projects/[id]/plan.vue` → title: `${project.title} - 创作方案`
- `teams/index.vue` → title: "团队管理 - Drama Studio"

- [ ] **Step 3: Verify page titles in browser tab**

- [ ] **Step 4: Commit**

```bash
git add nuxt.config.ts app/pages/
git commit -m "feat: add SEO meta tags and dynamic page titles"
```

---

## Chunk 4: Developer Experience (Low Priority)

### Task 8: Testing Framework Setup

**Files:**
- Install: `vitest`, `@nuxt/test-utils`, `@vue/test-utils`
- Create: `vitest.config.ts`
- Create: `tests/server/utils/response.test.ts`
- Create: `tests/server/utils/validate.test.ts`
- Modify: `package.json` (add test script)

- [ ] **Step 1: Install testing dependencies**

```bash
pnpm add -D vitest @nuxt/test-utils @vue/test-utils happy-dom
```

- [ ] **Step 2: Create `vitest.config.ts`**

```typescript
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom',
      },
    },
  },
})
```

- [ ] **Step 3: Add test script to `package.json`**

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 4: Create `tests/server/utils/response.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'

describe('response utilities', () => {
  it('ok() wraps data with success flag', () => {
    // Import and test the ok function
    const result = { success: true, data: { id: '1' } }
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ id: '1' })
  })
})
```

- [ ] **Step 5: Create `tests/server/schemas/character.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { createCharacterSchema } from '../../server/schemas/character'

describe('character schema', () => {
  it('accepts valid input', () => {
    const result = createCharacterSchema.safeParse({ name: '林念念' })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = createCharacterSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing name', () => {
    const result = createCharacterSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 6: Run tests**

```bash
pnpm test
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add vitest.config.ts tests/ package.json pnpm-lock.yaml
git commit -m "feat: add Vitest testing framework with initial schema tests"
```

---

### Task 9: Nuxt 4 `shared/` Directory for Types

**Files:**
- Create: `shared/types/` (move type definitions)
- Modify: `app/core/types/` (re-export from shared)
- Modify: `nuxt.config.ts` (if needed)

- [ ] **Step 1: Create `shared/types/` directory and move types**

Move all `.ts` files from `app/core/types/` to `shared/types/`.

- [ ] **Step 2: Update `app/core/types/index.ts` to re-export from shared**

```typescript
export * from '#shared/types/user'
export * from '#shared/types/team'
// ... etc
```

Note: Nuxt 4 auto-imports from `shared/` using `#shared` alias.

- [ ] **Step 3: Verify server code and app code both resolve types**

- [ ] **Step 4: Commit**

```bash
git add shared/ app/core/types/
git commit -m "refactor: move shared types to shared/ directory (Nuxt 4 convention)"
```

---

### Task 10: Image Optimization with @nuxt/image

**Files:**
- Install: `@nuxt/image`
- Modify: `nuxt.config.ts`
- Modify: `app/components/project/EntityImageGallery.vue`
- Modify: `app/components/project/AssetCard.vue`

- [ ] **Step 1: Install @nuxt/image**

```bash
pnpm add @nuxt/image
```

- [ ] **Step 2: Configure in `nuxt.config.ts`**

Add to modules:
```typescript
modules: ['shadcn-nuxt', '@nuxt/image'],
image: {
  dir: 'uploads',
  quality: 80,
},
```

- [ ] **Step 3: Replace `<img>` with `<NuxtImg>` in key components**

In `EntityImageGallery.vue`:
```vue
<NuxtImg
  :src="`/uploads/${img.file_path}`"
  :alt="img.file_name || ''"
  class="w-full h-full object-cover"
  loading="lazy"
  width="200"
  height="200"
/>
```

- [ ] **Step 4: Verify images still load correctly**

- [ ] **Step 5: Commit**

```bash
git add nuxt.config.ts app/components/ package.json pnpm-lock.yaml
git commit -m "feat: add @nuxt/image for lazy loading and image optimization"
```

---

## Chunk 5: MCP Server — Complete CRUD Coverage (High Priority)

### Task 11: Add Missing CRUD Tools for Characters, Scenes, Props

**Files:**
- Modify: `mcp/tools/character-tools.ts`
- Modify: `mcp/tools/scene-prop-tools.ts`

- [ ] **Step 1: Add `get_character` and `delete_character` to `character-tools.ts`**

```typescript
get_character: {
  description: 'Get a single character by ID',
  inputSchema: {
    type: 'object',
    required: ['project_id', 'character_id'],
    properties: {
      project_id: { type: 'string', description: 'Project UUID' },
      character_id: { type: 'string', description: 'Character UUID' },
    },
  },
},
delete_character: {
  description: 'Delete a character',
  inputSchema: {
    type: 'object',
    required: ['project_id', 'character_id'],
    properties: {
      project_id: { type: 'string', description: 'Project UUID' },
      character_id: { type: 'string', description: 'Character UUID' },
    },
  },
},
```

Handler: GET `/api/projects/${project_id}/characters/${character_id}`, DELETE `/api/projects/${project_id}/characters/${character_id}`

- [ ] **Step 2: Add `get_character_relations` to `character-tools.ts`**

```typescript
get_character_relations: {
  description: 'List all character relationships in a project',
  inputSchema: {
    type: 'object',
    required: ['project_id'],
    properties: {
      project_id: { type: 'string', description: 'Project UUID' },
    },
  },
},
```

Handler: GET `/api/projects/${project_id}/character-relations`

- [ ] **Step 3: Add `get_scene`, `update_scene`, `delete_scene` to `scene-prop-tools.ts`**

```typescript
get_scene: {
  description: 'Get a single scene by ID',
  inputSchema: {
    type: 'object',
    required: ['project_id', 'scene_id'],
    properties: {
      project_id: { type: 'string' },
      scene_id: { type: 'string' },
    },
  },
},
update_scene: {
  description: 'Update an existing scene',
  inputSchema: {
    type: 'object',
    required: ['project_id', 'scene_id'],
    properties: {
      project_id: { type: 'string' },
      scene_id: { type: 'string' },
      name: { type: 'string' },
      location_type: { type: 'string', enum: ['int', 'ext'] },
      time_of_day: { type: 'string', enum: ['day', 'night', 'dawn', 'dusk'] },
      description: { type: 'string' },
      tags: { type: 'array', items: { type: 'string' } },
      image_prompt: { type: 'string' },
    },
  },
},
delete_scene: {
  description: 'Delete a scene',
  inputSchema: {
    type: 'object',
    required: ['project_id', 'scene_id'],
    properties: {
      project_id: { type: 'string' },
      scene_id: { type: 'string' },
    },
  },
},
```

- [ ] **Step 4: Add `get_prop`, `update_prop`, `delete_prop` to `scene-prop-tools.ts`**

Same pattern as scene, using `/api/projects/${project_id}/props/${prop_id}`.

- [ ] **Step 5: Register new tools in `mcp/server.ts`**

- [ ] **Step 6: Test all new tools**

```bash
# Test get/delete character
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"get_character","arguments":{"project_id":"...","character_id":"..."}},"id":1}'
```

- [ ] **Step 7: Commit**

```bash
git add mcp/
git commit -m "feat(mcp): add get/delete CRUD tools for characters, scenes, and props"
```

---

### Task 12: Add Missing CRUD Tools for Episodes and Storyboards

**Files:**
- Modify: `mcp/tools/episode-tools.ts`
- Modify: `mcp/tools/storyboard-tools.ts`

- [ ] **Step 1: Add `get_episode`, `update_episode`, `delete_episode` to `episode-tools.ts`**

Handlers:
- GET `/api/projects/${project_id}/episodes/${episode_number}`
- PUT `/api/projects/${project_id}/episodes/${episode_number}`
- DELETE `/api/projects/${project_id}/episodes/${episode_number}`

- [ ] **Step 2: Add `get_storyboard`, `update_storyboard`, `delete_storyboard`, `reorder_storyboards` to `storyboard-tools.ts`**

Handlers:
- GET `/api/projects/${project_id}/episodes/${episode_number}/storyboards/${storyboard_id}`
- PUT `/api/projects/${project_id}/episodes/${episode_number}/storyboards/${storyboard_id}`
- DELETE `/api/projects/${project_id}/episodes/${episode_number}/storyboards/${storyboard_id}`
- PUT `/api/projects/${project_id}/episodes/${episode_number}/storyboards/reorder` (body: `{ ids: string[] }`)

- [ ] **Step 3: Add `get_creative_plan` tool**

Handler: GET `/api/projects/${project_id}/plan`

- [ ] **Step 4: Register and test**

- [ ] **Step 5: Commit**

```bash
git add mcp/
git commit -m "feat(mcp): add get/update/delete/reorder for episodes and storyboards"
```

---

### Task 13: Add Asset CRUD and Team Tools

**Files:**
- Modify: `mcp/tools/asset-tools.ts`
- Create: `mcp/tools/team-tools.ts`

- [ ] **Step 1: Add `get_asset`, `update_asset`, `delete_asset` to `asset-tools.ts`**

Handlers:
- GET `/api/projects/${project_id}/assets/${asset_id}`
- PUT `/api/projects/${project_id}/assets/${asset_id}`
- DELETE `/api/projects/${project_id}/assets/${asset_id}`

Also add `batch_get_entity_assets`:
- GET `/api/projects/${project_id}/entity-assets/batch?entity_type=X&entity_ids=id1,id2`

- [ ] **Step 2: Create `mcp/tools/team-tools.ts`**

Tools: `list_teams`, `create_team`, `get_team`, `update_team`, `list_team_members`, `add_team_member`

- [ ] **Step 3: Register and test**

- [ ] **Step 4: Commit**

```bash
git add mcp/
git commit -m "feat(mcp): add asset CRUD and team management tools"
```

---

### Task 14: Enhance Input Schemas with Enums and Descriptions

**Files:**
- Modify: all `mcp/tools/*.ts` files

- [ ] **Step 1: Add enum constraints to key fields**

Fields to enhance:
- `shot_type`: `['close', 'medium', 'wide', 'pov', 'establishing', 'insert', 'over_shoulder']`
- `camera_angle`: `['eye_level', 'high', 'low', 'dutch', 'overhead', 'ground']`
- `camera_movement`: `['static', 'pan', 'tilt', 'dolly', 'tracking', 'crane', 'handheld', 'zoom']`
- `transition_type`: `['cut', 'dissolve', 'fade', 'wipe', 'match_cut']`
- `hook_type`: `['悬念', '反转', '情感', '冲突', '揭秘']`
- `entity_type` (image-tools): `['character', 'scene', 'prop', 'storyboard']`
- `location_type`: `['int', 'ext']`
- `time_of_day`: `['day', 'night', 'dawn', 'dusk']`
- `rhythm_phase`: `['起势', '发展', '高潮', '收束']`

- [ ] **Step 2: Add descriptions to all schema properties**

Every `properties` entry should have a `description` field explaining what it does and expected format.

- [ ] **Step 3: Commit**

```bash
git add mcp/
git commit -m "feat(mcp): enhance tool schemas with enums, descriptions, and constraints"
```

---

## Chunk 6: Skills Documentation Update (Medium Priority)

### Task 15: Update SKILL.md and MCP README

**Files:**
- Modify: `skills/SKILL.md`
- Modify: `mcp/README.md`

- [ ] **Step 1: Update SKILL.md command overview**

Add to the MCP tools section:
- Image tools: `set_image_prompt`, `batch_set_image_prompts`, `list_entity_images`, `link_asset_to_entity`, `get_prompt_template`
- Version tools: `get_version_history`
- Missing CRUD tools (after Task 11-13 are done)

- [ ] **Step 2: Add `/分镜 N` command to SKILL.md**

```markdown
### /分镜 N
1. 加载 references/storyboard-guide.md、references/visual-style-guide.md
2. 使用 list_storyboards 获取第 N 集分镜
3. 引导用户设计分镜：镜头类型、机位、转场
4. 使用 set_image_prompt 为分镜设置画面提示词
5. 使用 get_prompt_template 生成标准化提示词
```

- [ ] **Step 3: Add villain_level/hook_type mapping notes**

In references section, add mapping comments:
- villain_level 0=无 1=表面反派 2=明暗反派 3=终极反派 4=隐藏大boss
- hook_type enum values ↔ hook-design.md categories

- [ ] **Step 4: Update MCP README**

- Update tool count (from 21 to ~35+ after new tools)
- Add image-tools, version-tools, team-tools sections
- Add usage examples for new tools

- [ ] **Step 5: Commit**

```bash
git add skills/ mcp/README.md
git commit -m "docs: update SKILL.md and MCP README with complete tool coverage"
```

---

### Task 16: Add Workflow Tools

**Files:**
- Create: `mcp/tools/workflow-tools.ts`
- Modify: `mcp/server.ts`

- [ ] **Step 1: Create `project_setup_wizard` tool**

A composite tool that:
1. Creates a project
2. Saves the creative plan
3. Creates initial characters
4. Creates initial episodes

Input: structured project brief with plan, characters, episodes.

```typescript
project_setup_wizard: {
  description: 'Create a complete project with creative plan, characters, and episodes in one step',
  inputSchema: {
    type: 'object',
    required: ['team_id', 'project'],
    properties: {
      team_id: { type: 'string', description: 'Team UUID' },
      project: {
        type: 'object',
        required: ['title', 'genre', 'total_episodes'],
        properties: {
          title: { type: 'string' },
          genre: { type: 'array', items: { type: 'string' } },
          total_episodes: { type: 'number' },
          tone: { type: 'string' },
          ending_type: { type: 'string' },
        },
      },
      plan: { type: 'object', description: 'Creative plan content (same as save_creative_plan)' },
      characters: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            public_identity: { type: 'string' },
            personality_tags: { type: 'array', items: { type: 'string' } },
          },
        },
      },
      episodes: {
        type: 'array',
        items: {
          type: 'object',
          required: ['episode_number'],
          properties: {
            episode_number: { type: 'number' },
            title: { type: 'string' },
            synopsis: { type: 'string' },
          },
        },
      },
    },
  },
},
```

Handler: sequentially call create_project → save_creative_plan → create_character (loop) → create_episode (loop).

- [ ] **Step 2: Register and test**

- [ ] **Step 3: Commit**

```bash
git add mcp/
git commit -m "feat(mcp): add project_setup_wizard workflow tool"
```

---

## Chunk 7: MCP Server Robustness (Low Priority)

### Task 17: API Client Improvements

**Files:**
- Modify: `mcp/lib/api-client.ts`

- [ ] **Step 1: Add timeout and safe JSON parsing**

```typescript
const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), 30000)

const init: RequestInit = { method, headers, signal: controller.signal }
if (body !== undefined) init.body = JSON.stringify(body)

try {
  const res = await fetch(url, init)
  clearTimeout(timeout)
  
  let json: any
  try {
    json = await res.json()
  } catch {
    throw new Error(`API Error [${res.status}]: Non-JSON response`)
  }
  // ... rest
} catch (err) {
  clearTimeout(timeout)
  if (err instanceof DOMException && err.name === 'AbortError') {
    throw new Error(`API Timeout: request to ${path} timed out after 30s`)
  }
  throw err
}
```

- [ ] **Step 2: Add structured error responses in server.ts**

```typescript
return {
  content: [{
    type: 'text',
    text: JSON.stringify({
      error: true,
      code: err instanceof ApiError ? err.code : 'INTERNAL_ERROR',
      message: msg,
    }, null, 2),
  }],
  isError: true,
}
```

- [ ] **Step 3: Commit**

```bash
git add mcp/
git commit -m "feat(mcp): add timeout, safe JSON parsing, and structured errors"
```

---

### Task 18: Batch Error Handling for Image Tools

**Files:**
- Modify: `mcp/tools/image-tools.ts`

- [ ] **Step 1: Improve `batch_set_image_prompts` response**

Replace the current array response with:
```typescript
{
  total: entities.length,
  success: successCount,
  failed: failedCount,
  results: [
    { entity_type: 'character', entity_id: '...', status: 'ok' },
    { entity_type: 'scene', entity_id: '...', status: 'error', error: 'Not found' },
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add mcp/tools/image-tools.ts
git commit -m "feat(mcp): improve batch_set_image_prompts error reporting"
```

---

## Summary

| Chunk | Tasks | Priority | Est. Time |
|-------|-------|----------|-----------|
| 1: Error Handling & UX | Task 1-3 | High | 30 min |
| 2: Security & Validation | Task 4-5 | High | 45 min |
| 3: TypeScript & SEO | Task 6-7 | Medium | 30 min |
| 4: Developer Experience | Task 8-10 | Low | 30 min |
| 5: MCP CRUD Coverage | Task 11-14 | High | 60 min |
| 6: Skills & Docs Update | Task 15-16 | Medium | 30 min |
| 7: MCP Robustness | Task 17-18 | Low | 20 min |

**Total estimated time: ~4 hours**

Each chunk is independently deployable. Recommended execution order: Chunk 1 → Chunk 2 → Chunk 5 → Chunk 3 → Chunk 6 → Chunk 4 → Chunk 7.
