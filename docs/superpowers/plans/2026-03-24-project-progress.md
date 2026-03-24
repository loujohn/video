# 项目详细进度展示 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为每个项目增加详细的创作进度展示（多行进度面板），并修复图片审核功能。

**Architecture:** 后端新增 `calcProjectProgress` 工具函数，复用到列表/详情/仪表盘三个 API。前端新建可复用的 `ProjectProgressPanel` 组件，嵌入项目卡片、概览页和仪表盘。审核功能从 `is_cover` 改为 `review_status`。

**Tech Stack:** Nuxt 3, Vue 3 Composition API, Knex.js, Vitest, TypeScript

---

## File Structure

| 操作 | 文件 | 职责 |
|------|------|------|
| Create | `server/utils/calcProjectProgress.ts` | 进度计算核心逻辑 |
| Create | `tests/utils/calcProjectProgress.test.ts` | 进度计算单元测试 |
| Create | `app/components/project/ProjectProgressPanel.vue` | 可复用进度面板组件 |
| Modify | `app/core/types/project.ts` | 增加 ProjectProgress 接口 |
| Modify | `server/api/projects/index.get.ts` | 支持 `?include=progress` |
| Modify | `server/api/projects/[id].get.ts` | 返回进度数据 |
| Modify | `server/api/dashboard/stats.get.ts` | recent_activity 带进度 |
| Modify | `app/components/project/ProjectCard.vue` | 嵌入进度面板 |
| Modify | `app/pages/projects/[id]/index.vue` | 嵌入详细进度面板 |
| Modify | `app/pages/index.vue` | 仪表盘列表带进度 |
| Modify | `app/components/project/EntityImageGallery.vue` | 审核逻辑修改 |
| Modify | `app/components/project/DetailHeroSection.vue` | 审核状态适配 |

## Chunk 1: 后端进度计算 + 审核功能

### Task 1: ProjectProgress 类型定义

**Files:**
- Modify: `app/core/types/project.ts`

- [ ] **Step 1: 在 project.ts 末尾添加 ProjectProgress 接口**

```typescript
export interface ProjectProgress {
  overall_percent: number
  creative_plan: boolean
  characters: { total: number; with_looks: number }
  scenes: { total: number }
  episodes: { total: number; created: number; written: number; writing: number }
  storyboards: { total: number; with_image_prompt: number; with_video_prompt: number }
  images: { total_storyboards: number; with_images: number; approved: number }
}

export interface ProjectWithProgress extends Project {
  progress?: ProjectProgress
}
```

- [ ] **Step 2: Commit**

```bash
git add app/core/types/project.ts
git commit -m "feat: add ProjectProgress type definition"
```

### Task 2: 进度计算函数 — 测试先行

**Files:**
- Create: `tests/utils/calcProjectProgress.test.ts`
- Create: `server/utils/calcProjectProgress.ts`

- [ ] **Step 1: 编写 calcProjectProgress 测试**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockDb = {
  where: vi.fn().mockReturnThis(),
  whereIn: vi.fn().mockReturnThis(),
  join: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  count: vi.fn().mockReturnThis(),
  first: vi.fn(),
  raw: vi.fn((str: string) => str),
  andWhere: vi.fn().mockReturnThis(),
  andWhereRaw: vi.fn().mockReturnThis(),
}

vi.mock('../../app/core/db', () => ({
  getDb: () => {
    const fn = (table: string) => {
      mockDb._lastTable = table
      return mockDb
    }
    fn.raw = mockDb.raw
    return fn
  },
}))

describe('calcProjectProgress', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mockDb.where.mockReturnValue(mockDb)
    mockDb.whereIn.mockReturnValue(mockDb)
    mockDb.join.mockReturnValue(mockDb)
    mockDb.select.mockReturnValue(mockDb)
    mockDb.count.mockReturnValue(mockDb)
    mockDb.andWhere.mockReturnValue(mockDb)
    mockDb.andWhereRaw.mockReturnValue(mockDb)
  })

  it('returns zero progress for empty project', async () => {
    mockDb.first
      .mockResolvedValueOnce(undefined)           // creative_plan
      .mockResolvedValueOnce({ total: 0, wl: 0 }) // characters
      .mockResolvedValueOnce({ count: 0 })         // scenes
      .mockResolvedValueOnce({ created: 0, written: 0, writing: 0 }) // episodes
      .mockResolvedValueOnce({ total: 0, wip: 0, wvp: 0 }) // storyboards
      .mockResolvedValueOnce({ wi: 0, approved: 0 }) // images

    const { calcProjectProgress } = await import('../../server/utils/calcProjectProgress')
    const result = await calcProjectProgress('proj-1', 10)

    expect(result.overall_percent).toBe(0)
    expect(result.creative_plan).toBe(false)
    expect(result.characters.total).toBe(0)
    expect(result.episodes.total).toBe(10)
    expect(result.episodes.created).toBe(0)
  })

  it('calculates full progress for complete project', async () => {
    mockDb.first
      .mockResolvedValueOnce({ id: 'plan-1' })     // creative_plan exists
      .mockResolvedValueOnce({ total: 5, wl: 5 })  // all characters have looks
      .mockResolvedValueOnce({ count: 8 })          // scenes
      .mockResolvedValueOnce({ created: 10, written: 10, writing: 0 }) // episodes all written
      .mockResolvedValueOnce({ total: 60, wip: 60, wvp: 60 })  // storyboards
      .mockResolvedValueOnce({ wi: 60, approved: 60 }) // images all approved

    const { calcProjectProgress } = await import('../../server/utils/calcProjectProgress')
    const result = await calcProjectProgress('proj-1', 10)

    expect(result.overall_percent).toBe(100)
    expect(result.creative_plan).toBe(true)
    expect(result.characters.with_looks).toBe(5)
    expect(result.episodes.written).toBe(10)
    expect(result.images.approved).toBe(60)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run tests/utils/calcProjectProgress.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: 实现 calcProjectProgress**

```typescript
// server/utils/calcProjectProgress.ts
import { getDb } from '~/core/db'
import type { ProjectProgress } from '~/core/types/project'

export async function calcProjectProgress(
  projectId: string,
  totalEpisodes: number,
): Promise<ProjectProgress> {
  const db = getDb()

  const plan = await db('creative_plans').where({ project_id: projectId }).first()
  const hasPlan = !!plan

  const charStats = await db('characters')
    .where({ project_id: projectId, is_active: true })
    .select(
      db.raw('count(*) as total'),
      db.raw('count(CASE WHEN id IN (SELECT DISTINCT character_id FROM character_looks WHERE is_active = true) THEN 1 END) as wl'),
    )
    .first()

  const sceneStats = await db('scenes')
    .where({ project_id: projectId, is_active: true })
    .count('id as count')
    .first()

  const epStats = await db('episodes')
    .where({ project_id: projectId })
    .select(
      db.raw('count(*) as created'),
      db.raw("count(CASE WHEN status = 'written' THEN 1 END) as written"),
      db.raw("count(CASE WHEN status = 'writing' THEN 1 END) as writing"),
    )
    .first()

  const sbStats = await db('storyboards')
    .join('episodes', 'storyboards.episode_id', 'episodes.id')
    .where({ 'episodes.project_id': projectId, 'storyboards.is_active': true })
    .select(
      db.raw('count(*) as total'),
      db.raw('count(storyboards.image_prompt) as wip'),
      db.raw('count(storyboards.video_prompt) as wvp'),
    )
    .first()

  const imgStats = await db('storyboards')
    .join('episodes', 'storyboards.episode_id', 'episodes.id')
    .where({ 'episodes.project_id': projectId, 'storyboards.is_active': true })
    .select(
      db.raw(`count(DISTINCT CASE WHEN storyboards.id IN (
        SELECT linked_entity_id FROM assets WHERE linked_entity_type = 'storyboard' AND type = 'image' AND is_active = true
      ) THEN storyboards.id END) as wi`),
      db.raw(`count(DISTINCT CASE WHEN storyboards.id IN (
        SELECT linked_entity_id FROM assets WHERE linked_entity_type = 'storyboard' AND type = 'image' AND is_active = true AND metadata::text LIKE '%"review_status":"approved"%'
      ) THEN storyboards.id END) as approved`),
    )
    .first()

  const charTotal = Number(charStats?.total || 0)
  const charWithLooks = Number(charStats?.wl || 0)
  const sceneTotal = Number(sceneStats?.count || 0)
  const epCreated = Number(epStats?.created || 0)
  const epWritten = Number(epStats?.written || 0)
  const epWriting = Number(epStats?.writing || 0)
  const sbTotal = Number(sbStats?.total || 0)
  const sbWithImagePrompt = Number(sbStats?.wip || 0)
  const sbWithVideoPrompt = Number(sbStats?.wvp || 0)
  const imgWithImages = Number(imgStats?.wi || 0)
  const imgApproved = Number(imgStats?.approved || 0)

  const te = totalEpisodes || 1
  const expectedSb = te * 6
  const sbBase = sbTotal || expectedSb

  const weights = [
    { pct: hasPlan ? 100 : 0, w: 5 },
    { pct: charTotal > 0 ? (charWithLooks / charTotal) * 100 : 0, w: 10 },
    { pct: sceneTotal > 0 ? 100 : 0, w: 5 },
    { pct: (epWritten / te) * 100, w: 20 },
    { pct: Math.min((sbTotal / expectedSb) * 100, 100), w: 20 },
    { pct: sbBase > 0 ? (imgWithImages / sbBase) * 100 : 0, w: 25 },
    { pct: sbBase > 0 ? (imgApproved / sbBase) * 100 : 0, w: 15 },
  ]

  const overall = Math.round(weights.reduce((s, { pct, w }) => s + (pct * w) / 100, 0))

  return {
    overall_percent: Math.min(overall, 100),
    creative_plan: hasPlan,
    characters: { total: charTotal, with_looks: charWithLooks },
    scenes: { total: sceneTotal },
    episodes: { total: totalEpisodes, created: epCreated, written: epWritten, writing: epWriting },
    storyboards: { total: sbTotal, with_image_prompt: sbWithImagePrompt, with_video_prompt: sbWithVideoPrompt },
    images: { total_storyboards: sbBase, with_images: imgWithImages, approved: imgApproved },
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npx vitest run tests/utils/calcProjectProgress.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/utils/calcProjectProgress.ts tests/utils/calcProjectProgress.test.ts
git commit -m "feat: add project progress calculation utility with tests"
```

### Task 3: 修改项目列表 API 支持 include=progress

**Files:**
- Modify: `server/api/projects/index.get.ts`

- [ ] **Step 1: 读取现有 server/api/projects/index.get.ts**

- [ ] **Step 2: 在返回前加入 progress 数据**

在现有逻辑后追加：

```typescript
import { calcProjectProgress } from '~/../../server/utils/calcProjectProgress'

// 在 handler 中获取 query 参数
const query = getQuery(event)
const includeProgress = (query.include as string || '').split(',').includes('progress')

// 查询 projects 后，如果 includeProgress
if (includeProgress) {
  const results = await Promise.all(
    projects.map(async (p) => ({
      ...p,
      progress: await calcProjectProgress(p.id, p.total_episodes),
    })),
  )
  return ok(results)
}
return ok(projects)
```

- [ ] **Step 3: 运行全量测试确认不回归**

```bash
npx vitest run
```

- [ ] **Step 4: Commit**

```bash
git add server/api/projects/index.get.ts
git commit -m "feat: project list API supports ?include=progress"
```

### Task 4: 修改项目详情 API 返回进度

**Files:**
- Modify: `server/api/projects/[id].get.ts` (或对应路由文件)

- [ ] **Step 1: 读取现有项目详情 API**

- [ ] **Step 2: 在返回数据中追加 progress 字段**

```typescript
import { calcProjectProgress } from '~/../../server/utils/calcProjectProgress'

// 在获取 project 后
const progress = await calcProjectProgress(project.id, project.total_episodes)
return ok({ ...project, progress })
```

- [ ] **Step 3: 运行测试**

```bash
npx vitest run
```

- [ ] **Step 4: Commit**

```bash
git add server/api/projects/[id].get.ts
git commit -m "feat: project detail API returns progress data"
```

### Task 5: 修改仪表盘 API 带进度

**Files:**
- Modify: `server/api/dashboard/stats.get.ts`

- [ ] **Step 1: 在 recentActivity 循环中加入 progress 计算**

```typescript
import { calcProjectProgress } from '~/../../server/utils/calcProjectProgress'

// 在 recentActivity push 时加入 progress
recentActivity.push({
  ...existingFields,
  progress: await calcProjectProgress(project.id, project.total_episodes || 10),
})
```

- [ ] **Step 2: 运行测试**

```bash
npx vitest run
```

- [ ] **Step 3: Commit**

```bash
git add server/api/dashboard/stats.get.ts
git commit -m "feat: dashboard stats includes project progress"
```

### Task 6: 修复审核功能

**Files:**
- Modify: `app/components/project/EntityImageGallery.vue`

- [ ] **Step 1: 修改 confirmAsset 函数**

将 `confirmAsset` 改为 `approveAsset`：

```typescript
async function approveAsset(asset: Asset) {
  const currentStatus = (asset.metadata as any)?.review_status
  const newStatus = currentStatus === 'approved' ? 'pending' : 'approved'
  const newMeta = { ...(asset.metadata as any), review_status: newStatus }

  try {
    await $api(`/api/projects/${props.projectId}/assets/${asset.id}`, {
      method: 'PUT', body: { metadata: newMeta },
    })
    toast.success(newStatus === 'approved' ? '已审核通过' : '已取消审核')
    await refresh()
    emit('refresh')
  } catch { toast.error('操作失败') }
}
```

- [ ] **Step 2: 更新 isCover 和 hasConfirmedCover 相关逻辑**

```typescript
function isApproved(asset: Asset): boolean {
  return (asset.metadata as any)?.review_status === 'approved'
}

const approvedCount = computed(() =>
  activeAssets.value.filter(i => isApproved(i)).length,
)
```

- [ ] **Step 3: 更新模板中的 UI**

- 将绿色勾按钮 title 改为 "审核通过" / "取消审核"
- 已审核徽章显示 "已审核" 而不是 "已确认"
- 点击事件改为 `approveAsset(item)`

- [ ] **Step 4: 修改 DetailHeroSection.vue 适配**

确保 Hero 区域：
- 优先显示 approved 图片
- 未审核图片默认显示最新上传的

- [ ] **Step 5: 运行测试 + 手动验证**

```bash
npx vitest run
```

- [ ] **Step 6: Commit**

```bash
git add app/components/project/EntityImageGallery.vue app/components/project/DetailHeroSection.vue
git commit -m "fix: change confirm-cover to review-approval workflow"
```

## Chunk 2: 前端进度面板组件 + 集成

### Task 7: 创建 ProjectProgressPanel 组件

**Files:**
- Create: `app/components/project/ProjectProgressPanel.vue`

- [ ] **Step 1: 创建可复用进度面板组件**

Props:
- `progress: ProjectProgress` — 进度数据
- `detailed?: boolean` — 是否显示详细副标题（概览页用 true）

布局：
- 2×2 网格：分集、分镜、图片、审核
- 每行：标签 + 进度条 + 数字
- 底部：已完成阶段徽章 + 综合百分比
- 颜色：分集 indigo-500、分镜 amber-500、图片 pink-500、审核 green-500

- [ ] **Step 2: Commit**

```bash
git add app/components/project/ProjectProgressPanel.vue
git commit -m "feat: add reusable ProjectProgressPanel component"
```

### Task 8: 集成到项目列表卡片

**Files:**
- Modify: `app/components/project/ProjectCard.vue`
- Modify: `app/pages/projects/index.vue`

- [ ] **Step 1: 修改 projects/index.vue 请求加 ?include=progress**

```typescript
const { data: projects } = useAsyncData('projects', () =>
  $api<ProjectWithProgress[]>('/api/projects?include=progress'),
)
```

- [ ] **Step 2: 修改 ProjectCard props 接受 progress**

- [ ] **Step 3: 在 ProjectCard 模板中嵌入 ProjectProgressPanel**

- [ ] **Step 4: 运行测试**

```bash
npx vitest run
```

- [ ] **Step 5: Commit**

```bash
git add app/components/project/ProjectCard.vue app/pages/projects/index.vue
git commit -m "feat: project list cards show progress panel"
```

### Task 9: 集成到项目概览页

**Files:**
- Modify: `app/pages/projects/[id]/index.vue`

- [ ] **Step 1: 从 project 数据中读取 progress**

- [ ] **Step 2: 在概览页嵌入 ProjectProgressPanel（detailed 模式）**

- [ ] **Step 3: 运行测试**

```bash
npx vitest run
```

- [ ] **Step 4: Commit**

```bash
git add app/pages/projects/[id]/index.vue
git commit -m "feat: project overview shows detailed progress panel"
```

### Task 10: 集成到仪表盘

**Files:**
- Modify: `app/pages/index.vue`

- [ ] **Step 1: 更新 DashboardStats 接口，recent_activity 加 progress**

- [ ] **Step 2: 在列表项中嵌入 ProjectProgressPanel**

- [ ] **Step 3: 运行全量测试**

```bash
npx vitest run
```

- [ ] **Step 4: Commit**

```bash
git add app/pages/index.vue
git commit -m "feat: dashboard recent activity shows project progress"
```

### Task 11: 最终验证

- [ ] **Step 1: 运行全量测试**

```bash
npx vitest run
```

- [ ] **Step 2: 启动开发服务器手动验证**

检查：
1. 项目列表页 — 每个卡片显示进度面板
2. 项目概览页 — 显示详细进度面板
3. 仪表盘 — 最近项目列表显示进度
4. 分镜详情 — 审核按钮功能正常（✓ 变为审核通过/取消审核）

- [ ] **Step 3: Commit all**

```bash
git add -A
git commit -m "feat: project progress display and review workflow"
```
