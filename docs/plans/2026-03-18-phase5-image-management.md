# Phase 5: 图片资源管理增强

## 背景

用户核心需求：**角色、分镜、场景、道具都要有生成对应资源的提示词和生成的对应图片资源**。这是短剧 AI 生产流程中最重要的关联。

## 已实现功能

### 5.1 数据层（Migration）

- `characters`, `scenes`, `props`, `storyboards` 表增加 `image_prompt` (text) 字段
- `assets` 表增加 `tags` (jsonb) 字段
- 类型定义和 Model 层同步更新

### 5.2 实体关联图片系统

#### API 端点
- `GET /api/projects/:id/assets?linked_entity_type=&linked_entity_id=&type=image` — 获取实体关联图片
- `GET /api/projects/:id/entity-assets/batch?entity_type=&entity_ids=` — 批量获取，减少 N+1
- `PUT /api/projects/:id/assets/:aid` — 更新图片状态（is_active, metadata 等）

#### EntityImageGallery 组件
可复用的图片管理组件，嵌入每个实体的卡片和编辑表单：

**核心功能：**
- 提示词展示（amber 高亮卡片）
- 图片网格（可配置列数，compact 模式）
- 上传图片（点击按钮 + 拖拽上传 + 多文件支持 + 进度条）
- 图片预览（Lightbox，左右箭头导航，文件名和位置信息）
- 设为封面（星标高亮，indigo 边框，存储在 asset metadata.is_cover）
- 废弃/恢复（灰显 + grayscale，可折叠展示废弃图片）
- 彻底删除
- Toast 操作通知（vue-sonner）

**展示策略：**
- 卡片外部：提示词 + 图片网格 + 上传按钮（直观可见）
- 编辑表单内部：提示词编辑 + 图片网格 + 上传按钮（完整操作）

### 5.3 资源库增强

- 状态筛选标签：启用中 / 已废弃 / 全部
- 资源卡片 hover 显示快捷废弃/恢复按钮
- 批量操作栏：批量废弃、批量恢复、批量删除
- 图片对比功能
- 关联实体类型 Badge 显示

### 5.4 分镜图片画廊

- StoryboardCard 组件接收 `projectId`，内嵌 EntityImageGallery
- 网格视图和时间线视图均展示图片
- StoryboardFormDialog 内编辑时也可管理图片

### 5.5 MCP 图像工具

- `set_image_prompt` — 设置单个实体的图像提示词
- `batch_set_image_prompts` — 批量设置提示词
- `list_entity_images` — 列出实体关联图片
- `link_asset_to_entity` — 关联资源到实体
- `get_prompt_template` — 获取提示词模板（6种风格 × 4种实体类型）

## 技术要点

### 拖拽上传
EntityImageGallery 根元素绑定 `@drop` / `@dragover` / `@dragleave` 事件，支持直接拖拽图片到任意实体卡片上传。

### SSR 兼容
- `vue-sonner` Toaster 用 `<ClientOnly>` 包裹（避免 SSR hydration mismatch）
- `vuedraggable` 用 `defineAsyncComponent` + `<ClientOnly>` 包裹

### 性能优化
- 批量实体图片 API (`/entity-assets/batch`) 支持一次查询最多 100 个实体的图片
- `AssetModel.findByEntities` 使用 `whereIn` 单次查询

### 安全
- 路径遍历防护（StorageService.deleteFile）
- MIME 类型白名单限制上传
- `safeImageUrl` XSS 防护
- `StoryboardModel.reorder` 完整 ID 校验

## 文件清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `migrations/20260318200000_add_image_prompt_and_tags.ts` | 新增 | image_prompt + tags 迁移 |
| `core/types/{character,scene,prop,storyboard}.ts` | 修改 | 增加 image_prompt 字段 |
| `core/types/asset.ts` | 修改 | 增加 tags, 更新接口 |
| `core/models/asset.model.ts` | 修改 | is_active 筛选, metadata 更新, findByEntities |
| `core/services/asset.service.ts` | 修改 | 支持 metadata 更新 |
| `server/api/projects/[id]/entity-assets/batch.get.ts` | 新增 | 批量图片查询 |
| `server/api/projects/[id]/entity-assets/index.get.ts` | 新增 | 实体图片列表 |
| `server/api/projects/[id]/entity-assets/link.put.ts` | 新增 | 图片关联 |
| `components/project/EntityImageGallery.vue` | 新增 | 核心图片管理组件 |
| `pages/projects/[id]/characters.vue` | 修改 | 集成图片画廊 |
| `pages/projects/[id]/scenes.vue` | 修改 | 场景+道具集成图片画廊 |
| `pages/projects/[id]/assets.vue` | 修改 | 状态筛选, 批量操作 |
| `components/project/StoryboardCard.vue` | 修改 | 接收 projectId, 内嵌画廊 |
| `components/project/StoryboardFormDialog.vue` | 修改 | 表单内图片管理 |
| `pages/projects/[id]/episodes/[num]/storyboards.vue` | 修改 | 传递 projectId |
| `mcp/tools/image-tools.ts` | 新增 | MCP 图像工具 |
| `app.vue` | 修改 | 添加 vue-sonner Toaster |
