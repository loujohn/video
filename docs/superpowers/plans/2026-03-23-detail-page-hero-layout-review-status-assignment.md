# 详情页 Hero 布局 + 评审状态 + 任务分配 实现计划

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 优化四个详情页（角色、场景、道具、分镜）的展示方式——图片优先的 Hero 布局、提示词可见性增强、评审状态系统、负责人分配、分镜 slot 分组。

**Architecture:** 数据库新增 review_status 和 assigned_to 字段 → 后端 Model/Service/Schema 扩展 → 两个新前端组件（DetailHeroSection、AssigneePicker）→ EntityImageGallery 改造 → 四个详情页重写 → 列表页改造 → MCP 工具更新。

**Tech Stack:** Nuxt 3, Vue 3 Composition API, Knex (PostgreSQL), shadcn-vue, Lucide icons, Zod v4, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-23-detail-page-hero-layout-review-status-assignment-design.md`

---

## Chunk 1: 数据库迁移 + 类型定义 + Schema 验证

### Task 1: 数据库迁移 — review_status + assigned_to

**Files:**
- Create: `migrations/20260323000000_review_status_assignment.ts`

- [ ] **Step 1: 创建迁移文件**

```typescript
// migrations/20260323000000_review_status_assignment.ts
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('character_looks', (t) => {
    t.string('review_status').defaultTo('draft')
  })
  await knex.schema.alterTable('scene_variants', (t) => {
    t.string('review_status').defaultTo('draft')
  })
  await knex.schema.alterTable('prop_variants', (t) => {
    t.string('review_status').defaultTo('draft')
  })
  await knex.schema.alterTable('characters', (t) => {
    t.uuid('assigned_to').references('id').inTable('users').onDelete('SET NULL')
  })
  await knex.schema.alterTable('scenes', (t) => {
    t.uuid('assigned_to').references('id').inTable('users').onDelete('SET NULL')
  })
  await knex.schema.alterTable('props', (t) => {
    t.uuid('assigned_to').references('id').inTable('users').onDelete('SET NULL')
  })
  await knex.schema.alterTable('storyboards', (t) => {
    t.uuid('assigned_to').references('id').inTable('users').onDelete('SET NULL')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('storyboards', (t) => { t.dropColumn('assigned_to') })
  await knex.schema.alterTable('props', (t) => { t.dropColumn('assigned_to') })
  await knex.schema.alterTable('scenes', (t) => { t.dropColumn('assigned_to') })
  await knex.schema.alterTable('characters', (t) => { t.dropColumn('assigned_to') })
  await knex.schema.alterTable('prop_variants', (t) => { t.dropColumn('review_status') })
  await knex.schema.alterTable('scene_variants', (t) => { t.dropColumn('review_status') })
  await knex.schema.alterTable('character_looks', (t) => { t.dropColumn('review_status') })
}
```

- [ ] **Step 2: 运行迁移**

Run: `npx knex migrate:latest`
Expected: Migration applied successfully

- [ ] **Step 3: Commit**

```bash
git add migrations/20260323000000_review_status_assignment.ts
git commit -m "feat: add review_status and assigned_to columns"
```

---

### Task 2: TypeScript 类型更新

**Files:**
- Modify: `app/core/types/character-look.ts`
- Modify: `app/core/types/scene-variant.ts`
- Modify: `app/core/types/prop-variant.ts`
- Modify: `app/core/types/character.ts`
- Modify: `app/core/types/scene.ts`
- Modify: `app/core/types/prop.ts`
- Modify: `app/core/types/storyboard.ts`

- [ ] **Step 1: 更新 character-look.ts**

在 `CharacterLook` 接口中新增 `review_status` 和 `cover_asset_url` 字段：

```typescript
export interface CharacterLook {
  id: string
  character_id: string
  name: string
  description: string | null
  image_prompt: string | null
  is_base: boolean
  review_status: string  // 'draft' | 'in_review' | 'confirmed'
  sort_order: number
  is_active: boolean
  created_at: Date
  updated_at: Date
  cover_asset_url?: string | null  // 由 API 返回，非数据库字段
}

export interface CreateCharacterLookInput {
  name: string
  description?: string
  image_prompt?: string
  is_base?: boolean
  sort_order?: number
  review_status?: string
}
```

- [ ] **Step 2: 更新 scene-variant.ts**

在 `SceneVariant` 接口中新增 `review_status` 和 `cover_asset_url`：

```typescript
export interface SceneVariant {
  // ... existing fields ...
  review_status: string  // 'draft' | 'in_review' | 'confirmed'
  cover_asset_url?: string | null
}

export interface CreateSceneVariantInput {
  // ... existing fields ...
  review_status?: string
}
```

- [ ] **Step 3: 更新 prop-variant.ts**

同 scene-variant 模式。

- [ ] **Step 4: 更新 character.ts**

在 `Character` 接口新增 `assigned_to` 和 `assigned_to_name`：

```typescript
export interface Character {
  // ... existing fields ...
  assigned_to: string | null
  assigned_to_name?: string | null  // 由 API JOIN 返回
}

export interface CreateCharacterInput {
  // ... existing fields ...
  assigned_to?: string | null
}
```

- [ ] **Step 5: 更新 scene.ts、prop.ts、storyboard.ts**

每个类型文件中的主接口新增 `assigned_to: string | null` 和 `assigned_to_name?: string | null`。
每个 CreateInput 接口新增 `assigned_to?: string | null`。

- [ ] **Step 6: Commit**

```bash
git add app/core/types/
git commit -m "feat: add review_status and assigned_to to type definitions"
```

---

### Task 3: Zod Schema 更新

**Files:**
- Modify: `server/schemas/character-look.ts`
- Modify: `server/schemas/scene-variant.ts`
- Modify: `server/schemas/prop-variant.ts`
- Modify: `server/schemas/character.ts`
- Modify: `server/schemas/scene.ts`
- Modify: `server/schemas/prop.ts`
- Modify: `server/schemas/storyboard.ts`

- [ ] **Step 1: 更新 character-look.ts schema**

```typescript
import { z } from 'zod/v4'

const reviewStatusEnum = z.enum(['draft', 'in_review', 'confirmed'])

export const createCharacterLookSchema = z.object({
  name: z.string().min(1, '形象名称必填').max(100),
  description: z.string().max(2000).optional(),
  image_prompt: z.string().max(5000).optional(),
  is_base: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  review_status: reviewStatusEnum.optional(),
})

export const updateCharacterLookSchema = createCharacterLookSchema.partial().extend({
  is_active: z.boolean().optional(),
})
```

- [ ] **Step 2: 更新 scene-variant.ts 和 prop-variant.ts schema**

同样添加 `review_status: reviewStatusEnum.optional()` 到 create 和 update schema。

- [ ] **Step 3: 更新 character.ts schema**

在 `createCharacterSchema` 中新增：

```typescript
assigned_to: z.string().uuid().optional().nullable(),
```

`updateCharacterSchema` 自动继承（基于 `.partial()`）。

- [ ] **Step 4: 更新 scene.ts、prop.ts、storyboard.ts schema**

每个 create schema 新增 `assigned_to: z.string().uuid().optional().nullable()`。

- [ ] **Step 5: Commit**

```bash
git add server/schemas/
git commit -m "feat: add review_status and assigned_to to validation schemas"
```

---

### Task 4: Model 层更新 — review_status 支持

**Files:**
- Modify: `app/core/models/character-look.model.ts`
- Modify: `app/core/models/scene-variant.model.ts`
- Modify: `app/core/models/prop-variant.model.ts` (如果存在，结构类似)

- [ ] **Step 1: 更新 CharacterLookModel**

在 `update` 方法的 `fields` 数组中添加 `'review_status'`：

```typescript
async update(id: string, data: Partial<CreateCharacterLookInput> & { is_active?: boolean }): Promise<CharacterLook | undefined> {
  const fields = ['name', 'description', 'image_prompt', 'is_base', 'sort_order', 'is_active', 'review_status'] as const
  const updateData = buildUpdateData(data, fields)
  const [row] = await getDb()(TABLE).where({ id }).update(updateData).returning('*')
  return row
}
```

在 `findByCharacter` 方法中增加 cover_asset_url 子查询：

```typescript
async findByCharacter(characterId: string): Promise<CharacterLook[]> {
  const db = getDb()
  const looks = await db(TABLE)
    .where({ character_id: characterId, is_active: true })
    .orderBy('sort_order', 'asc')

  if (!looks.length) return looks

  const lookIds = looks.map(l => l.id)
  const covers = await db('assets')
    .whereIn('linked_entity_id', lookIds)
    .where({ linked_entity_type: 'character_look', is_active: true })
    .andWhere(function () {
      this.whereRaw("(metadata->>'is_cover')::boolean = true")
    })
    .select('linked_entity_id', 'file_path')

  const coverMap = new Map(covers.map(c => [c.linked_entity_id, `/uploads/${c.file_path}`]))

  // fallback: 如果没有 is_cover，取最新的
  const fallbackIds = lookIds.filter(id => !coverMap.has(id))
  if (fallbackIds.length) {
    const latestAssets = await db('assets')
      .whereIn('linked_entity_id', fallbackIds)
      .where({ linked_entity_type: 'character_look', is_active: true, type: 'image' })
      .distinctOn('linked_entity_id')
      .orderByRaw('linked_entity_id, created_at DESC')
      .select('linked_entity_id', 'file_path')

    for (const a of latestAssets) {
      if (!coverMap.has(a.linked_entity_id)) {
        coverMap.set(a.linked_entity_id, `/uploads/${a.file_path}`)
      }
    }
  }

  return looks.map(l => ({ ...l, cover_asset_url: coverMap.get(l.id) || null }))
}
```

- [ ] **Step 2: 更新 SceneVariantModel 和 PropVariantModel**

同样的模式：update 方法添加 `review_status`，findByScene/findByProp 方法添加 cover_asset_url 子查询。

- [ ] **Step 3: Commit**

```bash
git add app/core/models/character-look.model.ts app/core/models/scene-variant.model.ts app/core/models/prop-variant.model.ts
git commit -m "feat: add review_status support and cover_asset_url to look/variant models"
```

---

### Task 5: Model 层更新 — assigned_to 支持

**Files:**
- Modify: `app/core/models/character.model.ts`
- Modify: `app/core/models/scene.model.ts`
- Modify: `app/core/models/prop.model.ts`
- Modify: `app/core/models/storyboard.model.ts` (如果有)

- [ ] **Step 1: 更新 CharacterModel**

在 `create` 方法的 insert 对象中添加 `assigned_to`：

```typescript
assigned_to: input.assigned_to ?? null,
```

在 `update` 方法的 `fields` 数组中添加 `'assigned_to'`。

在 `findByProject` 方法中 LEFT JOIN users 获取 assigned_to_name：

```typescript
async findByProject(projectId: string): Promise<Character[]> {
  return getDb()(TABLE)
    .leftJoin('users', `${TABLE}.assigned_to`, 'users.id')
    .where({ [`${TABLE}.project_id`]: projectId })
    .orderBy(`${TABLE}.sort_order`, 'asc')
    .select(`${TABLE}.*`, 'users.name as assigned_to_name')
}

async findById(id: string): Promise<Character | undefined> {
  return getDb()(TABLE)
    .leftJoin('users', `${TABLE}.assigned_to`, 'users.id')
    .where({ [`${TABLE}.id`]: id })
    .select(`${TABLE}.*`, 'users.name as assigned_to_name')
    .first()
}
```

- [ ] **Step 2: 更新 SceneModel、PropModel、StoryboardModel**

同样模式：create 添加 assigned_to，update fields 添加 'assigned_to'，findByProject/findById 添加 LEFT JOIN users。

注意：StoryboardModel 查询可能更复杂（已有关联查询），需要在现有查询基础上添加 JOIN，小心不要破坏现有逻辑。

- [ ] **Step 3: Commit**

```bash
git add app/core/models/
git commit -m "feat: add assigned_to support with user name join to entity models"
```

---

## Chunk 2: 前端新组件 + EntityImageGallery 改造

### Task 6: DetailHeroSection 组件

**Files:**
- Create: `app/components/project/DetailHeroSection.vue`

- [ ] **Step 1: 创建 DetailHeroSection 组件**

```vue
<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

interface HeroItem {
  id: string
  name: string
  imageUrl: string | null
  reviewStatus: string
  hasConfirmedCover: boolean
}

const props = defineProps<{
  items: HeroItem[]
}>()

const emit = defineEmits<{
  (e: 'click', itemId: string): void
}>()

const scrollRef = ref<HTMLDivElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

function checkScroll() {
  const el = scrollRef.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 0
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}

function scrollBy(dir: 'left' | 'right') {
  scrollRef.value?.scrollBy({ left: dir === 'left' ? -240 : 240, behavior: 'smooth' })
}

onMounted(() => { nextTick(checkScroll) })

const statusConfig: Record<string, { label: string; class: string }> = {
  draft: { label: '草稿', class: 'bg-zinc-100 text-zinc-500' },
  in_review: { label: '审查中', class: 'bg-amber-100 text-amber-700' },
  confirmed: { label: '已确认', class: 'bg-emerald-100 text-emerald-700' },
}
</script>

<template>
  <div class="relative">
    <!-- Scroll buttons -->
    <button
      v-if="canScrollLeft"
      type="button"
      class="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/90 border border-zinc-200 shadow flex items-center justify-center hover:bg-white"
      @click="scrollBy('left')"
    >
      <ChevronLeft class="h-4 w-4" />
    </button>
    <button
      v-if="canScrollRight"
      type="button"
      class="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/90 border border-zinc-200 shadow flex items-center justify-center hover:bg-white"
      @click="scrollBy('right')"
    >
      <ChevronRight class="h-4 w-4" />
    </button>

    <!-- Scrollable container -->
    <div
      ref="scrollRef"
      class="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
      @scroll="checkScroll"
    >
      <div
        v-for="item in items"
        :key="item.id"
        class="flex-shrink-0 w-48 cursor-pointer group"
        @click="emit('click', item.id)"
      >
        <!-- Image -->
        <div
          class="aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all"
          :class="[
            item.reviewStatus === 'confirmed' ? 'border-emerald-400' :
            item.reviewStatus === 'in_review' ? 'border-amber-400' :
            'border-zinc-200',
            'group-hover:shadow-lg group-hover:scale-[1.02]',
          ]"
        >
          <img
            v-if="item.imageUrl"
            :src="item.imageUrl"
            :alt="item.name"
            class="w-full h-full object-cover"
          />
          <div
            v-else
            class="w-full h-full bg-zinc-100 flex items-center justify-center"
          >
            <span class="text-xs text-zinc-400">暂无图片</span>
          </div>
        </div>

        <!-- Name + status -->
        <div class="mt-2 flex items-center gap-1.5">
          <span class="text-sm font-medium text-zinc-700 truncate">{{ item.name }}</span>
          <span
            v-if="statusConfig[item.reviewStatus]"
            class="text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap"
            :class="statusConfig[item.reviewStatus].class"
          >
            {{ statusConfig[item.reviewStatus].label }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/project/DetailHeroSection.vue
git commit -m "feat: add DetailHeroSection component for hero image display"
```

---

### Task 7: AssigneePicker 组件

**Files:**
- Create: `app/components/project/AssigneePicker.vue`

- [ ] **Step 1: 创建 AssigneePicker 组件**

```vue
<script setup lang="ts">
import { UserCircle, ChevronDown, X } from 'lucide-vue-next'

const props = defineProps<{
  projectId: string
  modelValue: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', userId: string | null): void
}>()

const { $api } = useApi()
const open = ref(false)

const { data: members } = useAsyncData(
  `team-members-${props.projectId}`,
  async () => {
    const project = await $api<{ team_id: string }>(`/api/projects/${props.projectId}`)
    return $api<Array<{ user_id: string; user_name: string; user_email: string }>>(`/api/teams/${project.team_id}/members`)
  },
)

const currentMember = computed(() =>
  members.value?.find(m => m.user_id === props.modelValue),
)

function select(userId: string | null) {
  emit('update:modelValue', userId)
  open.value = false
}
</script>

<template>
  <div class="relative">
    <button
      type="button"
      class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-sm transition-colors"
      @click="open = !open"
    >
      <UserCircle class="h-4 w-4 text-zinc-400" />
      <span :class="currentMember ? 'text-zinc-700' : 'text-zinc-400'">
        {{ currentMember?.user_name || '未分配' }}
      </span>
      <ChevronDown class="h-3 w-3 text-zinc-400" />
    </button>

    <!-- Dropdown -->
    <div
      v-if="open"
      class="absolute top-full mt-1 right-0 z-30 bg-white rounded-xl border border-zinc-200 shadow-lg w-52 py-1 max-h-60 overflow-auto"
    >
      <button
        type="button"
        class="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-50"
        @click="select(null)"
      >
        <X class="h-3.5 w-3.5" /> 取消分配
      </button>
      <div class="border-t border-zinc-100 my-1" />
      <button
        v-for="m in members"
        :key="m.user_id"
        type="button"
        class="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-indigo-50 transition-colors"
        :class="m.user_id === modelValue ? 'text-indigo-700 bg-indigo-50/50' : 'text-zinc-700'"
        @click="select(m.user_id)"
      >
        <div class="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center shrink-0">
          <span class="text-[10px] font-semibold text-indigo-600">{{ m.user_name?.charAt(0) || '?' }}</span>
        </div>
        {{ m.user_name }}
      </button>
    </div>

    <!-- Click-outside to close -->
    <div v-if="open" class="fixed inset-0 z-20" @click="open = false" />
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/project/AssigneePicker.vue
git commit -m "feat: add AssigneePicker component for task assignment"
```

---

### Task 8: EntityImageGallery 改造 — 提示词展示 + 评审状态 + Slot 过滤

**Files:**
- Modify: `app/components/project/EntityImageGallery.vue`

这个 Task 改动较多，分步骤说明。

- [ ] **Step 1: 新增 slot prop 和前端过滤逻辑**

在 props 中新增：

```typescript
slot?: number | null
```

在 `activeAssets` computed 中增加 slot 过滤：

```typescript
const activeAssets = computed(() =>
  (assets.value ?? [])
    .filter(i => i.is_active)
    .filter(i => props.slot == null || (i.metadata as any)?.slot === props.slot)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
)
```

上传时如果有 slot，自动传入 metadata：

```typescript
if (props.slot != null) {
  formData.append('metadata', JSON.stringify({ slot: props.slot }))
}
```

- [ ] **Step 2: 改造候选图网格中的提示词展示**

将 hover tooltip 改为图片下方的文字摘要：

把每个候选图的 `aspect-square` 改为自适应高度布局（图片 + 文字）。在 `<img>` 或 `<video>` 下方添加：

```html
<div v-if="getGenerationPrompt(item)" class="px-1.5 py-1">
  <p
    class="text-[10px] text-zinc-500 cursor-pointer"
    :class="expandedPrompts.has(item.id) ? '' : 'line-clamp-2'"
    @click.stop="togglePromptExpand(item.id)"
  >
    {{ getGenerationPrompt(item) }}
  </p>
</div>
```

新增响应式状态：

```typescript
const expandedPrompts = ref<Set<string>>(new Set())
function togglePromptExpand(id: string) {
  if (expandedPrompts.value.has(id)) expandedPrompts.value.delete(id)
  else expandedPrompts.value.add(id)
}
```

移除旧的 hover tooltip。

- [ ] **Step 3: 添加评审状态角标**

在候选图 hover actions 中增加「确认」按钮：

```html
<button
  v-if="(item.metadata as any)?.review_status !== 'approved'"
  type="button"
  class="h-7 w-7 rounded-full bg-emerald-500/90 flex items-center justify-center hover:bg-emerald-600 transition-colors"
  title="确认"
  @click.stop="approveAsset(item)"
>
  <Check class="h-3.5 w-3.5 text-white" />
</button>
```

在图片左上角显示已确认状态：

```html
<div v-if="(item.metadata as any)?.review_status === 'approved'" class="absolute top-1 right-1">
  <div class="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center">
    <Check class="h-2.5 w-2.5 text-white" />
  </div>
</div>
```

新增方法：

```typescript
async function approveAsset(asset: Asset) {
  const newMeta = { ...(asset.metadata as any), review_status: 'approved' }
  try {
    await $api(`/api/projects/${props.projectId}/assets/${asset.id}`, {
      method: 'PUT', body: { metadata: newMeta },
    })
    toast.success('已确认')
    await refresh()
  } catch { toast.error('操作失败') }
}
```

- [ ] **Step 4: 改造大图预览 dialog — 增加提示词面板 + 复制按钮**

在预览 dialog 的 info bar 下方添加提示词面板：

```html
<!-- Prompt panel in preview -->
<div v-if="previewItem && getGenerationPrompt(previewItem)" class="px-4 py-3 bg-zinc-50 border-t border-zinc-100">
  <div class="flex items-center justify-between mb-1">
    <p class="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Generation Prompt</p>
    <button
      type="button"
      class="text-[10px] text-indigo-600 hover:text-indigo-700 font-medium"
      @click="copyPrompt(getGenerationPrompt(previewItem!)!)"
    >
      复制
    </button>
  </div>
  <p class="text-xs text-zinc-700 whitespace-pre-wrap">{{ getGenerationPrompt(previewItem) }}</p>
</div>
```

新增方法：

```typescript
async function copyPrompt(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('已复制提示词')
  } catch { toast.error('复制失败') }
}
```

- [ ] **Step 5: 形象/变体级提示词增加复制按钮**

在现有的黄色提示词区块中添加复制按钮：

```html
<div v-if="imagePrompt" class="rounded-lg bg-amber-50 border border-amber-200/60 px-3 py-2 flex items-start gap-2">
  <div class="flex-1 min-w-0">
    <p class="text-[10px] font-medium text-amber-600 uppercase tracking-wider mb-0.5">提示词 Prompt</p>
    <p class="text-xs text-amber-900 whitespace-pre-wrap line-clamp-3">{{ imagePrompt }}</p>
  </div>
  <button
    type="button"
    class="text-[10px] text-amber-600 hover:text-amber-700 font-medium shrink-0 mt-2"
    @click="copyPrompt(imagePrompt!)"
  >
    复制
  </button>
</div>
```

- [ ] **Step 6: Commit**

```bash
git add app/components/project/EntityImageGallery.vue
git commit -m "feat: enhance EntityImageGallery with slot filter, prompt display, and review status"
```

---

## Chunk 3: 四个详情页重写

### Task 9: 角色详情页重写

**Files:**
- Modify: `app/pages/projects/[id]/characters/[cid].vue`

- [ ] **Step 1: 重写角色详情页**

核心改动：
1. 页面顶部新增 DetailHeroSection（从 looks 数据构建 items）
2. 顶部操作栏新增 AssigneePicker
3. 基本信息区域默认折叠（使用 `showBasicInfo` ref，默认 false）
4. 形象管理区默认全部展开（移除折叠手风琴，改为平铺显示所有形象）
5. 点击 Hero 中的形象 → scrollIntoView 到对应形象管理区

Hero items 构建逻辑：

```typescript
const heroItems = computed(() =>
  (looks.value ?? []).map(look => ({
    id: look.id,
    name: look.name,
    imageUrl: look.cover_asset_url || null,
    reviewStatus: look.review_status || 'draft',
    hasConfirmedCover: !!look.cover_asset_url,
  })),
)
```

assigned_to 更新方法：

```typescript
async function updateAssignee(userId: string | null) {
  try {
    await $api(`/api/projects/${projectId}/characters/${characterId}`, {
      method: 'PUT', body: { assigned_to: userId },
    })
    await refreshChar()
  } catch { toast.error('更新负责人失败') }
}
```

ScrollIntoView：

```typescript
function scrollToLook(lookId: string) {
  document.getElementById(`look-${lookId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
```

每个形象管理区的容器加上 `id`：`<div :id="'look-' + look.id">`

- [ ] **Step 2: 验证页面功能**

Run: `npx nuxi dev`
在浏览器中访问角色详情页，确认：
- Hero 区显示形象选中图
- 点击 Hero 图片滚动到对应区域
- 负责人选择器可用
- 基本信息可折叠/展开
- 形象管理区默认展开

- [ ] **Step 3: Commit**

```bash
git add app/pages/projects/[id]/characters/[cid].vue
git commit -m "feat: rewrite character detail page with hero layout and assignee"
```

---

### Task 10: 场景详情页重写

**Files:**
- Modify: `app/pages/projects/[id]/scenes/[sid].vue`

- [ ] **Step 1: 重写场景详情页**

与角色详情页同样模式：
1. DetailHeroSection（从 variants 数据构建 items）
2. AssigneePicker
3. 基本信息默认折叠
4. 变体管理默认展开（不再需要手动展开手风琴）
5. 点击 Hero 图片滚动到对应变体

- [ ] **Step 2: Commit**

```bash
git add app/pages/projects/[id]/scenes/[sid].vue
git commit -m "feat: rewrite scene detail page with hero layout and assignee"
```

---

### Task 11: 道具详情页重写

**Files:**
- Modify: `app/pages/projects/[id]/props/[propId].vue`

- [ ] **Step 1: 重写道具详情页**

与场景详情页完全一致的模式。

- [ ] **Step 2: Commit**

```bash
git add app/pages/projects/[id]/props/[propId].vue
git commit -m "feat: rewrite prop detail page with hero layout and assignee"
```

---

### Task 12: 分镜详情页重写

**Files:**
- Modify: `app/pages/projects/[id]/episodes/[num]/storyboards/[sbid].vue`

- [ ] **Step 1: 重写分镜详情页**

核心改动：
1. Hero 区展示各 slot 选中关键帧 + 选中视频缩略图
2. 基本信息（画面描述、台词等）默认折叠
3. 关键帧管理区按 slot 分组
4. 每个 slot 使用独立的 EntityImageGallery 实例（传入 `slot` prop）
5. 「+ 添加帧」按钮增加新的 slot

Slot 管理逻辑：

```typescript
const slotCount = ref(1)

const slotCovers = computed(() => {
  const all = assets.value ?? []
  const result: Array<{ slot: number; coverUrl: string | null }> = []
  for (let i = 1; i <= slotCount.value; i++) {
    const slotAssets = all.filter(a => a.is_active && (a.metadata as any)?.slot === i && a.type === 'image')
    const cover = slotAssets.find(a => (a.metadata as any)?.is_cover) || slotAssets[0]
    result.push({ slot: i, coverUrl: cover ? `/uploads/${cover.file_path}` : null })
  }
  return result
})

function addSlot() { slotCount.value++ }
```

初始化 slotCount：页面加载后从 assets 的 metadata.slot 取最大值：

```typescript
watch(assets, (val) => {
  if (!val) return
  const maxSlot = Math.max(1, ...val.filter(a => a.is_active).map(a => (a.metadata as any)?.slot ?? 0))
  slotCount.value = maxSlot
}, { immediate: true })
```

- [ ] **Step 2: Commit**

```bash
git add app/pages/projects/[id]/episodes/[num]/storyboards/[sbid].vue
git commit -m "feat: rewrite storyboard detail page with hero layout and slot grouping"
```

---

## Chunk 4: 列表页改造 + MCP 工具更新

### Task 13: EntityThumbnailRow 状态角标

**Files:**
- Modify: `app/components/project/EntityThumbnailRow.vue`

- [ ] **Step 1: 在缩略图上添加状态角标**

组件 props 中，items 增加可选的 `reviewStatus` 字段。渲染时在缩略图右上角显示状态标记：

```html
<div v-if="item.reviewStatus === 'confirmed'" class="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border border-white" />
<div v-else-if="item.reviewStatus === 'in_review'" class="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-amber-400 border border-white" />
```

- [ ] **Step 2: Commit**

```bash
git add app/components/project/EntityThumbnailRow.vue
git commit -m "feat: add review status badge to EntityThumbnailRow"
```

---

### Task 14: 角色/场景列表页 — 负责人筛选 + 显示

**Files:**
- Modify: `app/pages/projects/[id]/characters/index.vue`
- Modify: `app/pages/projects/[id]/scenes/index.vue`

- [ ] **Step 1: 更新角色列表页**

新增负责人筛选器（顶部工具栏）：

```typescript
const filterAssignee = ref<string | null>(null)

const filteredCharacters = computed(() => {
  let list = characters.value ?? []
  if (filterAssignee.value) {
    list = list.filter(c => c.assigned_to === filterAssignee.value)
  }
  return list
})
```

卡片上显示负责人头像缩写：

```html
<div v-if="char.assigned_to_name" class="absolute top-2 right-2">
  <div class="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center" :title="char.assigned_to_name">
    <span class="text-[9px] font-semibold text-indigo-600">{{ char.assigned_to_name?.charAt(0) }}</span>
  </div>
</div>
```

EntityThumbnailRow 传入 reviewStatus：

```html
<ProjectEntityThumbnailRow
  :items="looks.map(l => ({ id: l.id, name: l.name, imageUrl: l.cover_asset_url, reviewStatus: l.review_status }))"
  ...
/>
```

- [ ] **Step 2: 更新场景列表页**

同样模式添加负责人筛选和显示。

- [ ] **Step 3: Commit**

```bash
git add app/pages/projects/[id]/characters/index.vue app/pages/projects/[id]/scenes/index.vue
git commit -m "feat: add assignee filter and display to character and scene list pages"
```

---

### Task 15: 分镜列表页 — 负责人筛选

**Files:**
- Modify: `app/pages/projects/[id]/episodes/[num]/storyboards/index.vue`
- Modify: `app/components/project/StoryboardCard.vue`

- [ ] **Step 1: StoryboardCard 增加负责人显示**

在 StoryboardCard 的 props 中确认 storyboard 类型已包含 assigned_to_name。在卡片顶部右侧显示负责人头像。

- [ ] **Step 2: 分镜列表页增加负责人筛选**

同角色列表页模式，新增 `filterAssignee` 和 `filteredStoryboards` computed。

- [ ] **Step 3: Commit**

```bash
git add app/pages/projects/[id]/episodes/[num]/storyboards/index.vue app/components/project/StoryboardCard.vue
git commit -m "feat: add assignee display and filter to storyboard list"
```

---

### Task 16: MCP 工具更新

**Files:**
- Modify: `mcp/tools/character-look-tools.ts`
- Modify: `mcp/tools/scene-variant-tools.ts`
- Modify: `mcp/tools/prop-variant-tools.ts`
- Modify: `mcp/tools/storyboard-tools.ts`

- [ ] **Step 1: 更新形象/变体 MCP 工具**

在 create/update 工具的参数定义中新增 `review_status`：

```typescript
review_status: {
  type: 'string',
  description: '评审状态: draft | in_review | confirmed',
  enum: ['draft', 'in_review', 'confirmed'],
}
```

- [ ] **Step 2: 更新分镜 MCP 工具**

在 create/update 工具的参数定义中新增 `assigned_to`：

```typescript
assigned_to: {
  type: 'string',
  description: '负责人用户 ID (UUID)',
}
```

角色/场景/道具工具同样添加 assigned_to。

- [ ] **Step 3: 更新 skills/SKILL.md**

文档中说明新增的参数。

- [ ] **Step 4: Commit**

```bash
git add mcp/ skills/
git commit -m "feat: update MCP tools with review_status and assigned_to params"
```

---

### Task 17: 最终验证

- [ ] **Step 1: 运行所有测试**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 2: 启动开发服务器验证**

Run: `npx nuxi dev`
手动验证：
1. 角色详情页 Hero 布局正常
2. 场景详情页 Hero 布局正常
3. 道具详情页 Hero 布局正常
4. 分镜详情页 slot 分组正常
5. 提示词在候选图下方显示
6. 大图预览中提示词 + 复制按钮可用
7. 评审状态标记显示正确
8. 负责人选择和筛选功能正常

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: final verification and cleanup"
```
