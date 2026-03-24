# 项目详细进度展示 — 设计规格

## 概述

为每个项目增加详细的创作进度展示，覆盖从创意方案到图片审核的完整流水线。同时修复现有的"确认封面"功能为真正的"审核通过"功能。

## 范围

### 功能 1：审核功能修复

将现有的 `confirmAsset`（确认封面）改为图片审核功能：
- **当前行为**：点击 ✓ → `metadata.is_cover = true`，同一时间只能有一个封面
- **新行为**：点击 ✓ → `metadata.review_status = 'approved'`，多张图片可同时 approved
- Hero 区域显示最新图片，approved 图片优先展示
- 绿色边框 = 已审核，琥珀色边框 = 待审核

### 功能 2：进度数据 API

**端点**：复用现有列表接口，增加可选参数

- `GET /api/projects?include=progress` — 项目列表带进度
- `GET /api/dashboard/stats` — 仪表盘统计也带进度
- `GET /api/projects/:id` — 项目详情带进度（单独算）

**进度数据结构** (`ProjectProgress`)：

```typescript
interface ProjectProgress {
  overall_percent: number

  creative_plan: boolean

  characters: {
    total: number
    with_looks: number
  }

  scenes: {
    total: number
  }

  episodes: {
    total: number       // = project.total_episodes
    created: number
    written: number     // status = 'written'
    writing: number     // status = 'writing'
  }

  storyboards: {
    total: number
    with_image_prompt: number
    with_video_prompt: number
  }

  images: {
    total_storyboards: number
    with_images: number     // 有至少 1 张图片的分镜数
    approved: number        // 有 approved 图片的分镜数
  }
}
```

**综合进度权重算法**：

| 阶段 | 计算方式 | 权重 |
|------|---------|------|
| 创作方案 | 有 → 100%, 无 → 0% | 5% |
| 角色开发 | with_looks / total（0 角色时 0%） | 10% |
| 场景设计 | total > 0 → 100%, 否则 0% | 5% |
| 分集编写 | written / total_episodes | 20% |
| 分镜制作 | total / (total_episodes × 6) | 20% |
| 图片生成 | with_images / total_storyboards | 25% |
| 图片审核 | approved / total_storyboards | 15% |

## UI 设计

### 位置 1 & 3：项目列表卡片 + 仪表盘项目列表（同样式）

在 `ProjectCard` 底部增加多行进度面板：
- 2×2 网格布局，每行一个维度：分集、分镜、图片、审核
- 每行：标签 + 进度条 + 数字
- 底部一行：已完成阶段徽章（✓ 方案、✓ 角色N、✓ 场景N）+ 综合百分比
- 进度条颜色：分集 indigo-500、分镜 amber-500、图片 pink-500、审核 green-500

### 位置 2：项目概览页

在 `/projects/:id` 概览页增加独立面板：
- 标题："创作进度" + 综合百分比
- 已完成阶段徽章行
- 每个维度一行完整进度条，带副标题详情（如 "4 已完成 · 2 编写中 · 1 待编写"）
- 4 个维度：分集编写、分镜制作、图片生成、图片审核

## 涉及文件

### 后端
- `server/api/projects/index.get.ts` — 增加 `?include=progress` 支持
- `server/api/projects/[id].get.ts` — 返回进度数据
- `server/api/dashboard/stats.get.ts` — recent_activity 带进度
- 新建 `server/utils/calcProjectProgress.ts` — 进度计算工具函数

### 前端
- `app/components/project/ProjectCard.vue` — 增加进度面板
- `app/pages/projects/[id]/index.vue` — 增加进度面板
- `app/pages/index.vue` — 仪表盘列表项增加进度
- `app/components/project/EntityImageGallery.vue` — 审核逻辑修改
- `app/components/project/DetailHeroSection.vue` — 审核状态显示适配
- 新建 `app/components/project/ProjectProgressPanel.vue` — 可复用进度面板组件

### 类型
- `app/core/types/project.ts` — 增加 `ProjectProgress` 接口
