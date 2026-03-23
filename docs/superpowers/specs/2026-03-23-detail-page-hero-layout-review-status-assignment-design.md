# 详情页 Hero 布局 + 提示词展示 + 评审状态 + 任务分配 + 分镜 Slot 分组

## 概述

优化角色、场景、道具、分镜四个详情页的展示方式，将图片提升为页面视觉焦点（Hero 布局），增强提示词的可见性和可操作性，为候选图/视频和形象/变体引入评审状态系统，为实体增加负责人分配机制，并完善分镜图片的 slot 分组显示。

---

## 一、详情页 Hero 图片优先布局

### 1.1 设计原则

进入详情页时，用户一眼就能看到该实体的核心视觉产出（选中图）。文字信息退居次要位置。

### 1.2 角色详情页布局

```
┌─────────────────────────────────────────────────┐
│  ← 返回                        负责人 · 编辑 · 删除 │
├─────────────────────────────────────────────────┤
│  ★ Hero 区：形象选中图横排                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ 基础形象  │ │ 日常装   │ │ 战斗装   │        │
│  │ [选中大图]│ │ [选中大图]│ │ [选中大图]│        │
│  │           │ │          │ │          │        │
│  │  ● 已确认 │ │ ○ 草稿   │ │ ○ 审查中  │        │
│  └──────────┘ └──────────┘ └──────────┘        │
│  点击某张 → 滚动到下方对应形象管理区                  │
├─────────────────────────────────────────────────┤
│  角色名 · 身份 · 年龄                              │
│  性格标签 | 外貌 | 动机 | 口头禅（折叠区）           │
├─────────────────────────────────────────────────┤
│  参考图                                 + 上传    │
├─────────────────────────────────────────────────┤
│  形象管理                               + 添加    │
│  ┌─────────────────────────────────────┐        │
│  │ 基础形象 [已确认]                     │        │
│  │ [选中大图]                           │        │
│  │ 候选图网格（提示词 · 评论 · 选取 · 状态）│       │
│  │ 上传按钮 | 提示词                     │        │
│  └─────────────────────────────────────┘        │
│  ┌─────────────────────────────────────┐        │
│  │ 日常装 [草稿]                        │        │
│  │ ...                                 │        │
│  └─────────────────────────────────────┘        │
├─────────────────────────────────────────────────┤
│  角色关系                                        │
├─────────────────────────────────────────────────┤
│  关联分镜                                        │
└─────────────────────────────────────────────────┘
```

### 1.3 场景详情页布局

与角色详情页对称：Hero 区展示各变体的选中图横排。

```
┌─────────────────────────────────────────────────┐
│  ← 返回                        负责人 · 编辑 · 删除 │
├─────────────────────────────────────────────────┤
│  ★ Hero 区：变体选中图横排                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ 默认变体  │ │ 夜景版   │ │ 雨天版   │        │
│  │ [选中大图]│ │ [选中大图]│ │ [选中大图]│        │
│  │  ● 已确认 │ │ ○ 草稿   │ │ ○ 审查中  │        │
│  └──────────┘ └──────────┘ └──────────┘        │
├─────────────────────────────────────────────────┤
│  场景名 · 内外景 · 时间 · 描述 · 标签（折叠区）      │
├─────────────────────────────────────────────────┤
│  参考图 | 变体管理 | 关联分镜                       │
└─────────────────────────────────────────────────┘
```

### 1.4 道具详情页布局

与场景详情页完全一致。

### 1.5 分镜详情页布局

```
┌─────────────────────────────────────────────────┐
│  ← 返回                      上一个 | 下一个       │
├─────────────────────────────────────────────────┤
│  ★ Hero 区：各 slot 选中关键帧横排 + 选中视频        │
│  ┌──────────┐ ┌──────────┐                      │
│  │  Slot 1  │ │  Slot 2  │  ▶ [选中视频缩略图]   │
│  │ [选中大图]│ │ [选中大图]│                      │
│  └──────────┘ └──────────┘                      │
├─────────────────────────────────────────────────┤
│  #01 · 近景 · 推镜头 · 直切 · 5秒                 │
│  画面描述 | 台词 | 动作 | 音效 | 提示词（折叠区）     │
├─────────────────────────────────────────────────┤
│  关联实体                                        │
├─────────────────────────────────────────────────┤
│  关键帧管理（按 slot 分组）              + 添加帧    │
│  ┌─────────────────────────────────────┐        │
│  │ Slot 1                               │       │
│  │ 候选图网格（提示词 · 评论 · 选取 · 状态）│       │
│  └─────────────────────────────────────┘        │
│  ┌─────────────────────────────────────┐        │
│  │ Slot 2                               │       │
│  │ 候选图网格（提示词 · 评论 · 选取 · 状态）│       │
│  └─────────────────────────────────────┘        │
├─────────────────────────────────────────────────┤
│  视频管理                                        │
│  候选视频列表（提示词 · 评论 · 选取 · 状态）         │
├─────────────────────────────────────────────────┤
│  分镜评论（整体讨论）                               │
└─────────────────────────────────────────────────┘
```

### 1.6 Hero 区数据来源

Hero 区需要每个形象/变体的选中图 URL。为避免 N+1 查询：

- 形象列表 API `GET /api/projects/:pid/characters/:cid/looks` 响应中新增 `cover_asset_url` 字段
- 场景变体列表 API `GET /api/projects/:pid/scenes/:sid/variants` 响应中新增 `cover_asset_url` 字段
- 道具变体列表 API `GET /api/projects/:pid/props/:propId/variants` 响应中新增 `cover_asset_url` 字段
- 分镜详情 API 响应中新增 `slot_covers: Array<{ slot: number, cover_url: string | null }>` 字段

后端在返回列表时，通过 LEFT JOIN assets 表查询每个 look/variant 的封面图（`is_cover = true` 或 `created_at DESC LIMIT 1`），直接在响应中返回 URL。

### 1.7 Hero 区交互

- 点击 Hero 区中的某个形象/变体/slot 选中图 → 平滑滚动到下方对应的管理区
- 没有选中图的形象/变体显示灰色占位 + 形象/变体名称
- Hero 区中显示每个形象/变体的评审状态标记

---

## 二、提示词展示优化

### 2.1 候选图网格中的提示词

当前：hover 时显示截断的 tooltip（120px 宽）。

改为：
- 每张候选图下方直接显示 `generation_prompt` 的前 1-2 行（约 60 字），文字截断
- 点击文字可展开查看完整提示词
- 没有 generation_prompt 的图片不显示

### 2.2 大图预览模式中的提示词

当前：无提示词展示。

改为：
- 预览 dialog 底部增加提示词面板
- 显示完整的 `generation_prompt`
- 右侧提供「复制」按钮，一键复制提示词文本
- 如果没有 generation_prompt 则不显示此面板

### 2.3 形象/变体级提示词

当前：在 EntityImageGallery 上方黄色区块中显示 `image_prompt`。

保持不变，但增加「复制」按钮。

---

## 三、分镜图片 Slot 分组显示

### 3.1 当前状态

分镜图片虽然通过 `metadata.slot` 字段支持多 slot，但前端 EntityImageGallery 不按 slot 分组显示，所有图片混在一起。

### 3.2 改造方案

在分镜详情页中，图片管理区域按 slot 分组：

```
关键帧管理                                + 添加帧
┌─────────────────────────────────────────────┐
│ Slot 1 - 关键帧 1                            │
│ [选中大图]                                   │
│ 候选图网格                                   │
│ 上传按钮                                     │
├─────────────────────────────────────────────┤
│ Slot 2 - 关键帧 2                            │
│ [选中大图]                                   │
│ 候选图网格                                   │
│ 上传按钮                                     │
└─────────────────────────────────────────────┘
```

### 3.3 Slot 管理

- 「+ 添加帧」按钮创建新的 slot（slot 编号自动递增）
- 每个 slot 有独立的候选图、选中图、评论
- 可删除空的 slot（没有候选图的 slot）
- slot 编号连续，删除后重新编号

### 3.4 上传到指定 slot

上传图片时自动分配到当前 slot。每个 slot 区域有自己的上传按钮。

### 3.5 EntityImageGallery 组件改造

新增 `slot` prop：
- 传入 `slot` 时，仅显示该 slot 的图片
- 不传 `slot` 时，显示所有图片（现有行为）

**Slot 过滤方式**：前端客户端过滤。EntityImageGallery 加载分镜的所有图片后，根据 `metadata.slot` 在前端过滤。理由：
- 单个分镜的候选图数量有限（通常 < 50 张），前端过滤无性能问题
- 避免修改通用的 assets API 添加 metadata 过滤功能
- 上传时通过 metadata 传入 slot 编号：`formData.append('metadata', JSON.stringify({ slot: N }))`

分镜详情页使用多个 EntityImageGallery 实例，每个实例传入不同的 slot 值。

---

## 四、评审状态系统

### 4.1 候选图/视频级别的状态

为 asset 的 metadata 新增 `review_status` 字段：

| 状态值 | 含义 | 视觉效果 |
|--------|------|---------|
| `pending` | 待审查（默认） | 无特殊标记 |
| `approved` | 已确认 | 绿色勾选标记 |
| `rejected` | 已废弃 | 已有 is_active=false 机制复用 |

现有 `is_active = false` 即为已废弃。新增 `metadata.review_status` 区分「待审查」和「已确认」：
- 上传时默认 `review_status = 'pending'`
- 通过 `metadata.is_cover = true` 设为选中时，自动设为 `approved`
- 支持手动确认（approved）而不设为封面

### 4.2 形象/变体级别的状态

为 `character_looks`、`scene_variants`、`prop_variants` 表新增 `review_status` 字段：

```sql
ALTER TABLE character_looks ADD COLUMN review_status varchar DEFAULT 'draft';
ALTER TABLE scene_variants ADD COLUMN review_status varchar DEFAULT 'draft';
ALTER TABLE prop_variants ADD COLUMN review_status varchar DEFAULT 'draft';
```

| 状态值 | 含义 | 视觉效果 |
|--------|------|---------|
| `draft` | 草稿（默认） | 灰色空心圆 |
| `in_review` | 审查中 | 黄色圆标 |
| `confirmed` | 已确认 | 绿色实心圆 |

### 4.3 状态变更 API

资产级别：复用现有 PUT `/api/projects/:pid/assets/:id`，更新 `metadata.review_status`。

形象/变体级别：复用现有 PUT API，请求体新增 `review_status` 字段。

### 4.4 前端展示

**列表页卡片**：EntityThumbnailRow 中的缩略图角标显示形象/变体的 review_status。

**详情页 Hero 区**：每张选中图下方显示形象/变体名称 + 状态标记。

**候选图网格**：
- 已确认的图片：绿色勾选角标
- 待审查的图片：无特殊标记
- hover 操作增加「确认」按钮（设为 approved）

---

## 五、任务分配

### 5.1 数据模型

为角色、场景、道具、分镜四个实体增加 `assigned_to` 字段：

```sql
ALTER TABLE characters ADD COLUMN assigned_to uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE scenes ADD COLUMN assigned_to uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE props ADD COLUMN assigned_to uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE storyboards ADD COLUMN assigned_to uuid REFERENCES users(id) ON DELETE SET NULL;
```

### 5.2 API 变更

现有 CRUD API 的请求体和响应体新增 `assigned_to` 字段。

响应体同时返回 `assigned_to_name`（关联查询用户名）。

### 5.3 前端展示

**列表页**：
- 卡片上显示负责人头像/名字缩写
- 新增筛选器：按负责人筛选

**详情页**：
- 页面顶部操作栏显示负责人
- 点击可选择/更改负责人（从团队成员列表中选择）
- 下拉选择器组件，显示团队成员头像 + 名称

**编辑 Sheet/Form**：
- 新增负责人选择字段

---

## 六、数据库变更汇总

### 6.1 新增字段

```sql
-- 评审状态
ALTER TABLE character_looks ADD COLUMN review_status varchar DEFAULT 'draft';
ALTER TABLE scene_variants ADD COLUMN review_status varchar DEFAULT 'draft';
ALTER TABLE prop_variants ADD COLUMN review_status varchar DEFAULT 'draft';

-- 任务分配
ALTER TABLE characters ADD COLUMN assigned_to uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE scenes ADD COLUMN assigned_to uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE props ADD COLUMN assigned_to uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE storyboards ADD COLUMN assigned_to uuid REFERENCES users(id) ON DELETE SET NULL;
```

### 6.2 无新表

不需要创建新表。所有变更均为现有表的字段扩展。

---

## 七、API 变更汇总

### 7.1 现有 API 扩展

| API | 变更 |
|-----|------|
| PUT `/api/projects/:pid/characters/:cid/looks/:lid` | 请求体新增 `review_status` |
| PUT `/api/projects/:pid/scenes/:sid/variants/:vid` | 请求体新增 `review_status` |
| PUT `/api/projects/:pid/props/:propId/variants/:vid` | 请求体新增 `review_status` |
| GET/POST/PUT 角色 CRUD | 请求体新增 `assigned_to`，响应新增 `assigned_to_name` |
| GET/POST/PUT 场景 CRUD | 同上 |
| GET/POST/PUT 道具 CRUD | 同上 |
| GET/POST/PUT 分镜 CRUD | 同上 |

### 7.2 无新 API

不需要创建新的 API 路由。所有变更通过扩展现有 API 完成。

---

## 八、前端组件变更

### 8.1 EntityImageGallery 改造

- 新增 `slot` prop：按 slot 筛选图片
- 候选图下方显示提示词摘要（截断 + 展开）
- 候选图角标显示 `review_status`
- hover 操作增加「确认」按钮
- 大图预览 dialog 底部增加提示词面板 + 复制按钮
- 形象/变体级提示词区域增加复制按钮

### 8.2 新组件：DetailHeroSection

页面顶部的选中图横排展示区。

Props：
- `items: Array<{ id, name, imageUrl, reviewStatus, hasConfirmedCover }>`
- `entityType: 'look' | 'variant' | 'slot'`

Events：
- `@click(itemId)` — 点击某项，触发滚动到对应管理区

功能：
- 响应式横排展示选中图大图
- 无图时灰色占位 + 名称
- 每项下方显示名称 + 评审状态标记
- 溢出时提供左右翻页

### 8.3 新组件：AssigneePicker

负责人选择器。

Props：
- `projectId: string`
- `modelValue: string | null`（assigned_to UUID）

Events：
- `@update:modelValue(userId)`

功能：
- 显示当前负责人头像 + 名称（未分配时显示"未分配"）
- 点击展开下拉，列出团队成员
- 选择后触发更新

### 8.4 详情页改造

四个详情页（`[cid].vue`、`[sid].vue`、`[propId].vue`、`[sbid].vue`）：

- 顶部新增 DetailHeroSection
- 基本信息区域改为默认折叠（可展开查看详细文字信息）
- 顶部操作栏新增 AssigneePicker
- 形象/变体管理区默认展开（不再使用折叠手风琴）

分镜详情页额外：
- 关键帧管理区按 slot 分组，每个 slot 一个 EntityImageGallery 实例

### 8.5 列表页改造

角色/场景/道具列表页卡片：
- EntityThumbnailRow 缩略图角标显示 review_status
- 卡片上显示负责人
- 新增负责人筛选器

分镜列表页 StoryboardCard：
- 显示负责人
- 新增负责人筛选器

### 8.6 StoryboardCard 改造

- Hero 区域显示各 slot 选中图 + 选中视频缩略图
- 显示负责人头像

---

## 九、MCP 工具更新

- 角色形象工具：create/update 支持 `review_status`
- 场景变体工具：create/update 支持 `review_status`
- 道具变体工具：create/update 支持 `review_status`
- 角色/场景/道具/分镜工具：create/update 支持 `assigned_to`

---

## 十、文件变更清单

| 文件 | 变更 | 说明 |
|------|------|------|
| `migrations/20260323_review_status_assignment.ts` | 新增 | 评审状态 + 任务分配字段 |
| `app/components/project/DetailHeroSection.vue` | 新增 | Hero 选中图横排组件 |
| `app/components/project/AssigneePicker.vue` | 新增 | 负责人选择器组件 |
| `app/components/project/EntityImageGallery.vue` | 修改 | slot 分组 + 提示词展示 + 评审状态 + 预览提示词面板 |
| `app/pages/projects/[id]/characters/[cid].vue` | 修改 | Hero 布局 + 负责人 + 展开形象 |
| `app/pages/projects/[id]/scenes/[sid].vue` | 修改 | Hero 布局 + 负责人 + 展开变体 |
| `app/pages/projects/[id]/props/[propId].vue` | 修改 | Hero 布局 + 负责人 + 展开变体 |
| `app/pages/projects/[id]/episodes/[num]/storyboards/[sbid].vue` | 修改 | Hero 布局 + slot 分组 + 负责人 |
| `app/pages/projects/[id]/characters/index.vue` | 修改 | 负责人筛选 + 状态角标 |
| `app/pages/projects/[id]/scenes/index.vue` | 修改 | 负责人筛选 + 状态角标 |
| `app/pages/projects/[id]/episodes/[num]/storyboards/index.vue` | 修改 | 负责人筛选 |
| `app/components/project/StoryboardCard.vue` | 修改 | 负责人显示 |
| `app/components/project/EntityThumbnailRow.vue` | 修改 | 状态角标 |
| `app/core/types/character-look.ts` | 修改 | 新增 review_status 字段 |
| `app/core/types/scene-variant.ts` | 修改 | 新增 review_status 字段 |
| `app/core/types/prop-variant.ts` | 修改 | 新增 review_status 字段 |
| `app/core/types/character.ts` | 修改 | 新增 assigned_to 字段 |
| `app/core/types/scene.ts` | 修改 | 新增 assigned_to 字段 |
| `app/core/types/prop.ts` | 修改 | 新增 assigned_to 字段 |
| `app/core/types/storyboard.ts` | 修改 | 新增 assigned_to 字段 |
| `server/schemas/character-look.ts` | 修改 | 验证 review_status |
| `server/schemas/scene-variant.ts` | 修改 | 验证 review_status |
| `server/schemas/prop-variant.ts` | 修改 | 验证 review_status |
| `server/schemas/character.ts` | 修改 | 验证 assigned_to |
| `server/schemas/scene.ts` | 修改 | 验证 assigned_to |
| `server/schemas/prop.ts` | 修改 | 验证 assigned_to |
| `server/schemas/storyboard.ts` | 修改 | 验证 assigned_to |
| `app/core/models/character.model.ts` | 修改 | assigned_to 查询 |
| `app/core/models/scene.model.ts` | 修改 | assigned_to 查询 |
| `app/core/models/prop.model.ts` | 修改 | assigned_to 查询 |
| `app/core/models/storyboard.model.ts` | 修改 | assigned_to 查询 |
| `mcp/tools/character-look-tools.ts` | 修改 | review_status 参数 |
| `mcp/tools/scene-variant-tools.ts` | 修改 | review_status 参数 |
| `mcp/tools/prop-variant-tools.ts` | 修改 | review_status 参数 |
| `mcp/tools/storyboard-tools.ts` | 修改 | assigned_to 参数 |

---

## 十一、不做的事情（YAGNI）

- 不做实时协作感知（WebSocket 在线状态）——放到后续迭代
- 不做审批流程/工作流引擎——简单的状态标记即可
- 不做评审投票/多人确认——一人确认即可
- 不做操作历史日志——放到后续迭代
- 不做图片对比模式
- 不做候选图评分系统
