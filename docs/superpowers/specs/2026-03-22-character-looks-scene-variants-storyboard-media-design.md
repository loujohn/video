# 角色形象 + 场景变体 + 分镜图片/视频 + 文件服务修复

## 概述

重构系统的图片/视频管理逻辑，引入「角色形象」和「场景变体」概念，增强分镜的图片 slot 和视频支持，修复线上 Docker 环境无法预览上传文件的问题。

## 核心模式

所有实体遵循统一的「生成多个，选择一个」模式：

1. 实体有一个提示词（image_prompt）
2. 用 AI 生成多张候选图片/视频（或人工上传）
3. 每张候选图片/视频有自己的实际生成提示词（metadata.generation_prompt）
4. 团队成员可通过评论系统对候选图片/视频评审
5. 从中选择一张/一个作为「选中」的代表（metadata.is_cover = true）

---

## 一、数据库变更

### 1.1 新建 `character_looks` 表（角色形象）

```sql
CREATE TABLE character_looks (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id  uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  name          varchar NOT NULL,        -- 形象名称（如"日常装""战斗装"）
  description   text,                    -- 形象描述
  image_prompt  text,                    -- 图片生成提示词
  is_base       boolean DEFAULT false,   -- 是否基础形象（每角色有且仅有一个）
  sort_order    integer DEFAULT 0,
  is_active     boolean DEFAULT true,
  created_at    timestamp DEFAULT now(),
  updated_at    timestamp DEFAULT now()
);

CREATE INDEX idx_character_looks_character ON character_looks(character_id);
```

候选图片通过 `assets` 表关联：
- `linked_entity_type = 'character_look'`
- `linked_entity_id = look.id`
- `metadata.is_cover = true` 标记选中图
- `metadata.generation_prompt` 存储实际使用的提示词

### 1.2 新建 `scene_variants` 表（场景变体）

```sql
CREATE TABLE scene_variants (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  scene_id      uuid NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  name          varchar NOT NULL,        -- 变体名称（如"咖啡厅-夜晚"）
  description   text,                    -- 变体描述
  image_prompt  text,                    -- 图片生成提示词
  variant_type  varchar,                 -- 变体类型：time_of_day / weather / angle / custom
  sort_order    integer DEFAULT 0,
  is_active     boolean DEFAULT true,
  created_at    timestamp DEFAULT now(),
  updated_at    timestamp DEFAULT now()
);

CREATE INDEX idx_scene_variants_scene ON scene_variants(scene_id);
```

候选图片通过 `assets` 表关联：
- `linked_entity_type = 'scene_variant'`
- `linked_entity_id = variant.id`
- `metadata.is_cover = true` 标记选中图
- `metadata.generation_prompt` 存储实际使用的提示词

### 1.3 分镜图片和视频（无新表，扩展 asset metadata 语义）

**分镜图片**：`linked_entity_type = 'storyboard'`, `type = 'image'`
- `metadata.slot`：槽位号（单张图片分镜 slot=1，多关键帧分镜 slot=1,2,3...）
- `metadata.is_cover`：该 slot 内的选中图
- `metadata.generation_prompt`：实际生成提示词

**分镜视频**：`linked_entity_type = 'storyboard'`, `type = 'video'`
- `metadata.is_cover`：选中的视频
- `metadata.generation_prompt`：实际生成提示词

### 1.4 现有表变更

`characters` 表：`image_prompt` 字段保留但语义变为「角色整体描述提示词」，具体形象的提示词在 `character_looks` 表中。

`scenes` 表：`image_prompt` 字段保留但语义变为「场景整体描述提示词」，具体变体的提示词在 `scene_variants` 表中。

---

## 二、后端 API

### 2.1 角色形象 CRUD

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects/:pid/characters/:cid/looks` | 列出角色所有形象 |
| POST | `/api/projects/:pid/characters/:cid/looks` | 创建形象 |
| PUT | `/api/projects/:pid/characters/:cid/looks/:lid` | 更新形象 |
| DELETE | `/api/projects/:pid/characters/:cid/looks/:lid` | 删除形象 |

创建角色时自动创建一个基础形象（is_base = true）。

**请求体（POST/PUT）**：
```json
{
  "name": "日常装",
  "description": "白色T恤搭配牛仔裤的休闲造型",
  "image_prompt": "Casual outfit, white t-shirt...",
  "is_base": false,
  "sort_order": 1
}
```

### 2.2 场景变体 CRUD

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects/:pid/scenes/:sid/variants` | 列出场景所有变体 |
| POST | `/api/projects/:pid/scenes/:sid/variants` | 创建变体 |
| PUT | `/api/projects/:pid/scenes/:sid/variants/:vid` | 更新变体 |
| DELETE | `/api/projects/:pid/scenes/:sid/variants/:vid` | 删除变体 |

**请求体（POST/PUT）**：
```json
{
  "name": "咖啡厅-夜晚",
  "description": "暖色灯光下的咖啡厅内景",
  "image_prompt": "Cozy cafe interior at night...",
  "variant_type": "time_of_day",
  "sort_order": 1
}
```

### 2.3 文件服务路由（修复线上预览）

新增 `server/routes/uploads/[...path].get.ts`：
- 从 uploads 目录读取文件并返回
- 设置正确的 Content-Type
- 路径遍历防护（禁止 `..`，限制在 uploads 目录内）
- 缓存头设置（Cache-Control）

---

## 三、前端页面变更

### 3.1 角色页面（characters.vue）

**卡片变更**：
- 移除直接的 EntityImageGallery
- 改为显示「形象列表」：基础形象 + 其他形象
- 每个形象显示：名称、选中图（封面）缩略图、候选图数量
- 点击形象可展开查看/管理候选图片

**编辑表单变更**：
- 角色编辑表单中增加「形象管理」区域
- 可新增/编辑/删除形象
- 每个形象下嵌入 EntityImageGallery 管理候选图片

**创建流程**：
- 创建角色时自动创建一个「基础形象」
- 基础形象的 image_prompt 默认使用角色的 image_prompt

### 3.2 场景页面（scenes.vue）

**卡片变更**：
- 移除直接的 EntityImageGallery
- 改为显示「变体列表」
- 每个变体显示：名称、类型标签、选中图缩略图、候选图数量
- 点击变体可展开查看/管理候选图片

**编辑表单变更**：
- 场景编辑表单中增加「变体管理」区域
- 可新增/编辑/删除变体
- 每个变体下嵌入 EntityImageGallery 管理候选图片

### 3.3 分镜页面（storyboards.vue）

**卡片变更**：
- 同时显示「选中图片」和「选中视频」
- 图片区域支持多 slot（多关键帧）
- 视频区域支持上传和预览

**EntityImageGallery 增强**：
- 新增 `mediaType` prop：'image' | 'video' | 'all'
- 视频上传（accept 扩展为 video/*）
- 视频预览（`<video>` 标签替代 `<img>`）
- slot 分组显示（分镜场景）
- 每张图片/视频显示其 generation_prompt

### 3.4 EntityImageGallery 组件增强

新增 props：
- `mediaType?: 'image' | 'video' | 'all'` — 控制显示和上传的媒体类型
- `showSlots?: boolean` — 是否按 slot 分组显示
- `slotCount?: number` — slot 数量（分镜用）

新增功能：
- 视频文件上传和预览
- slot 分组视图
- 每个候选项显示 generation_prompt（可折叠）

---

## 四、MCP 工具新增

### 4.1 角色形象工具

| 工具名 | 说明 |
|--------|------|
| `list_character_looks` | 列出角色所有形象 |
| `create_character_look` | 创建角色形象 |
| `update_character_look` | 更新角色形象 |
| `delete_character_look` | 删除角色形象 |

### 4.2 场景变体工具

| 工具名 | 说明 |
|--------|------|
| `list_scene_variants` | 列出场景所有变体 |
| `create_scene_variant` | 创建场景变体 |
| `update_scene_variant` | 更新场景变体 |
| `delete_scene_variant` | 删除场景变体 |

### 4.3 SKILL.md 更新

更新 `/角色开发` 命令，增加形象管理工具。
更新 `/分镜 N` 命令，增加视频相关说明。
新增辅助命令表中的形象/变体工具。

---

## 五、文件服务修复

### 问题

当前系统在本地开发时，Nuxt dev server 会自动服务工作目录下的文件，所以 `/uploads/...` 路径可以正常访问。但在生产环境的 Docker 容器中，`.output` 中的构建产物不会自动服务 `/app/uploads/` 目录下的文件。

### 解决方案

新增 `server/routes/uploads/[...path].get.ts`：

```typescript
// 读取 uploads 目录下的文件并返回
// 安全措施：路径遍历防护、MIME 类型检测、缓存头
```

---

## 六、文件清单（预估）

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `migrations/20260322000000_character_looks_scene_variants.ts` | 新增 | 新建两张表 |
| `app/core/types/character-look.ts` | 新增 | CharacterLook 类型 |
| `app/core/types/scene-variant.ts` | 新增 | SceneVariant 类型 |
| `app/core/types/index.ts` | 修改 | 导出新类型 |
| `app/core/models/character-look.model.ts` | 新增 | CharacterLook Model |
| `app/core/models/scene-variant.model.ts` | 新增 | SceneVariant Model |
| `app/core/services/character-look.service.ts` | 新增 | 业务逻辑（含自动创建基础形象） |
| `app/core/services/scene-variant.service.ts` | 新增 | 业务逻辑 |
| `server/schemas/character-look.ts` | 新增 | 请求校验 |
| `server/schemas/scene-variant.ts` | 新增 | 请求校验 |
| `server/api/projects/[id]/characters/[cid]/looks/index.get.ts` | 新增 | 列出形象 |
| `server/api/projects/[id]/characters/[cid]/looks/index.post.ts` | 新增 | 创建形象 |
| `server/api/projects/[id]/characters/[cid]/looks/[lid].put.ts` | 新增 | 更新形象 |
| `server/api/projects/[id]/characters/[cid]/looks/[lid].delete.ts` | 新增 | 删除形象 |
| `server/api/projects/[id]/scenes/[sid]/variants/index.get.ts` | 新增 | 列出变体 |
| `server/api/projects/[id]/scenes/[sid]/variants/index.post.ts` | 新增 | 创建变体 |
| `server/api/projects/[id]/scenes/[sid]/variants/[vid].put.ts` | 新增 | 更新变体 |
| `server/api/projects/[id]/scenes/[sid]/variants/[vid].delete.ts` | 新增 | 删除变体 |
| `server/routes/uploads/[...path].get.ts` | 新增 | 文件服务路由 |
| `app/components/project/EntityImageGallery.vue` | 修改 | 支持视频、slot、generation_prompt |
| `app/pages/projects/[id]/characters.vue` | 修改 | 集成形象管理 |
| `app/pages/projects/[id]/scenes.vue` | 修改 | 集成变体管理 |
| `app/pages/projects/[id]/episodes/[num]/storyboards.vue` | 修改 | 图片 slot + 视频支持 |
| `app/components/project/StoryboardCard.vue` | 修改 | 显示选中图片和视频 |
| `app/components/project/StoryboardFormDialog.vue` | 修改 | 管理图片 slot 和视频 |
| `mcp/tools/character-look-tools.ts` | 新增 | MCP 角色形象工具 |
| `mcp/tools/scene-variant-tools.ts` | 新增 | MCP 场景变体工具 |
| `mcp/server.ts` | 修改 | 注册新工具 |
| `skills/SKILL.md` | 修改 | 更新命令表和工具列表 |

---

## 七、不做的事情（YAGNI）

- 不引入审批流程或状态机（复用现有评论系统即可）
- 不做图片/视频的 AI 生成集成（只管理提示词和候选资源）
- 不做候选资源的排序/评分功能
- 不做跨实体的资源共享
