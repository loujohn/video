# UI 改造 + 图片级评论 + 分镜 Slot + 实体关联

## 概述

改造角色、场景、道具、分镜四个模块的展示方式，使其更直观地呈现视觉素材；将评论系统下沉到图片/视频级别；增强分镜的多关键帧 slot 支持；建立分镜与角色形象、场景变体、道具变体的关联关系；为所有实体新增独立详情页面和参考图功能。

---

## 一、页面导航架构

### 1.1 新增详情页

| 路由 | 页面 | 用途 |
|------|------|------|
| `/projects/:pid/characters/:cid` | 角色详情页 | 完整角色信息 + 参考图 + 形象管理 + 关联分镜 |
| `/projects/:pid/scenes/:sid` | 场景详情页 | 完整场景信息 + 参考图 + 变体管理 + 关联分镜 |
| `/projects/:pid/props/:propId` | 道具详情页 | 完整道具信息 + 参考图 + 变体管理 + 关联分镜 |
| `/projects/:pid/episodes/:num/storyboards/:sbid` | 分镜详情页 | 完整分镜信息 + slot管理 + 视频管理 + 关联实体 |

### 1.2 列表页与详情页的关系

采用 **Sheet（快捷编辑）+ 详情页（完整视图）双通道** 模式：

- 卡片操作栏：「编辑」→ Sheet 快速修改基本信息；「详情」→ 跳转详情页；「删除」→ 确认对话框
- 点击卡片主体区域直接跳转详情页
- Sheet 仅用于轻量级基本信息编辑（名称、描述、提示词等）
- 深度操作（候选图管理、参考图、评论、关联、slot管理）在详情页完成

---

## 二、参考图功能

### 2.1 概念

参考图是用户人工提供的设计参考（如网络图片、概念图、情绪板素材），用于指导 AI 生成和团队沟通。与 AI 生成的候选图不同，参考图是输入而非输出。

### 2.2 适用实体

角色、场景、道具三个实体的本体级别（不是形象/变体级别）。

### 2.3 数据存储

复用 assets 表，用 `category` 字段区分：

- `category = 'reference'` → 参考图
- `category = 'candidate'`（或现有默认值） → AI 生成/上传的候选图

查询示例：
```
linked_entity_type='character' & linked_entity_id=cid & category='reference'
```

### 2.4 UI 展示

在详情页中，参考图区域位于形象/变体管理区上方：

```
┌─────────────────────────────────┐
│  参考图                 + 上传   │
│  [img1] [img2] [img3]          │
│  （可查看大图、可删除）          │
└─────────────────────────────────┘
```

参考图不需要评论和选取功能（它是输入不是输出）。

### 2.5 assets 表 category 字段

现有 assets 表已有 `category` 字段（varchar），当前默认值为 `'reference'`。需要区分两种用途：

- 参考图上传时 `category = 'reference_input'`（用户提供的参考素材）
- 候选图/视频上传时 `category = 'reference'`（保持现有默认值不变，即 AI 生成或用户上传的候选素材）

或者也可以用 `category = 'reference'` 给候选图和 `category = 'inspiration'` 给参考图——实现时确认最清晰的命名。

---

## 三、角色改造

### 3.1 角色列表卡片

**卡片正面**：
- 保留角色名称、身份、性格标签
- 去掉角色级"评论"按钮
- 新增「形象缩略图横排」：每个形象显示圆角缩略图（选中图 or 最新候选图 or 空占位），下方带形象名称
- 缩略图尺寸约 48x48 ~ 56x56，横排最多显示 5 个，溢出时显示翻页箭头可滚动查看
- 点击缩略图或卡片主体 → 跳转角色详情页

**卡片操作栏**：「编辑」（Sheet）| 「详情」（跳转）| 「删除」

### 3.2 角色详情页 `/projects/:pid/characters/:cid`

```
┌─────────────────────────────────────┐
│  ← 返回角色列表          编辑 | 删除│
├─────────────────────────────────────┤
│  角色名·身份·年龄                    │
│  性格标签 | 外貌描述 | 动机 | 口头禅│
│  AI提示词                           │
├─────────────────────────────────────┤
│  参考图                     + 上传   │
│  [ref1] [ref2] [ref3]              │
├─────────────────────────────────────┤
│  形象管理                    + 添加  │
│  ┌──────────────────────────┐       │
│  │ 基础形象                  │       │
│  │ [选中大图]                │       │
│  │ 候选图网格（评论+选取）   │       │
│  │ 上传按钮 | 提示词         │       │
│  └──────────────────────────┘       │
│  ┌──────────────────────────┐       │
│  │ 日常装                    │       │
│  │ [选中大图]                │       │
│  │ 候选图网格（评论+选取）   │       │
│  └──────────────────────────┘       │
├─────────────────────────────────────┤
│  角色关系                           │
│  张小妹 → 李明 (兄妹)              │
├─────────────────────────────────────┤
│  关联分镜                           │
│  #01 第1集 | #05 第2集 ...          │
└─────────────────────────────────────┘
```

**形象管理区**：
- 每个形象一个可折叠 section
- 展开后：选中图大图 + 候选图网格 + 上传 + 编辑名称/提示词
- 候选图 hover 操作：选取（星标）、评论（气泡+数量）、废弃
- 可添加/删除形象（基础形象不可删）

**关联分镜区**：
- 从 storyboard_character_looks 反查
- 每项显示：分镜序号、集数、slot1 选中图缩略图

### 3.3 封面选择逻辑

- 有 `metadata.is_cover = true` → 选中图（绿色边框 + 星标）
- 无 is_cover 但有候选图 → 最新一张（created_at DESC），虚线边框"未确认选定"
- 无候选图 → 灰色空占位

---

## 四、场景改造

### 4.1 场景列表卡片

- 保留场景名称、类型标签
- 去掉"评论"按钮
- 新增「变体缩略图横排」
- 点击 → 跳转场景详情页

### 4.2 场景详情页 `/projects/:pid/scenes/:sid`

布局与角色详情页对称：

- 场景基本信息（名称、内外景、时间、描述、标签、提示词）
- 参考图区域
- 变体管理（与角色形象管理交互完全一致）
- 关联分镜列表

---

## 五、道具改造

### 5.1 道具变体

道具逻辑与场景完全一致，引入道具变体系统。

**新建 `prop_variants` 表**（结构与 `scene_variants` 一致）：

```sql
CREATE TABLE prop_variants (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  prop_id       uuid NOT NULL REFERENCES props(id) ON DELETE CASCADE,
  name          varchar NOT NULL,
  description   text,
  image_prompt  text,
  variant_type  varchar,
  sort_order    integer DEFAULT 0,
  is_active     boolean DEFAULT true,
  created_at    timestamp DEFAULT now(),
  updated_at    timestamp DEFAULT now()
);

CREATE INDEX idx_prop_variants_prop ON prop_variants(prop_id);
```

**道具变体 CRUD API**：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects/:pid/props/:propId/variants` | 列出变体 |
| POST | `/api/projects/:pid/props/:propId/variants` | 创建变体 |
| PUT | `/api/projects/:pid/props/:propId/variants/:vid` | 更新变体 |
| DELETE | `/api/projects/:pid/props/:propId/variants/:vid` | 删除变体 |

**道具变体 MCP 工具**：list/create/update/delete_prop_variant

### 5.2 道具列表卡片

- 保留道具名称、描述
- 去掉"评论"按钮
- 新增「变体缩略图横排」
- 点击 → 跳转道具详情页

### 5.3 道具详情页 `/projects/:pid/props/:propId`

与场景详情页布局完全一致：

- 道具基本信息（名称、描述、标签、提示词）
- 参考图区域
- 变体管理
- 关联分镜列表

---

## 六、分镜改造

### 6.1 分镜列表卡片

**新布局**：
```
┌─────────────────────────────┐
│  #01  近景  推镜头  直切     │  ← Badge 行
├─────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐│
│  │ Slot1│ │ Slot2│ │ Slot3││  ← 选中关键帧横排
│  │  img │ │  img │ │  img ││
│  └──────┘ └──────┘ └──────┘│
├─────────────────────────────┤
│  ▶ 选中视频缩略图           │  ← 视频区
├─────────────────────────────┤
│  角色: 张小妹·日常装         │  ← 关联信息
│  场景: 咖啡厅·夜晚版         │
│  道具: 家族戒指·特写版       │
├─────────────────────────────┤
│  画面描述...  「台词...」    │
├─────────────────────────────┤
│  💬2    编辑 | 详情 | 🗑️    │  ← 操作栏
└─────────────────────────────┘
```

### 6.2 分镜详情页 `/projects/:pid/episodes/:num/storyboards/:sbid`

```
┌─────────────────────────────────────┐
│  ← 返回分镜列表      上一个 | 下一个│
├─────────────────────────────────────┤
│  #01 · 近景 · 推镜头 · 直切 · 5秒  │
│  画面描述 | 台词 | 动作 | 音效 | 提示词│
├─────────────────────────────────────┤
│  关键帧管理                 + 添加帧 │
│  ┌───────────┐ ┌───────────┐       │
│  │  Slot 1   │ │  Slot 2   │       │
│  │ [选中大图] │ │ [选中大图] │       │
│  │ 候选图网格 │ │ 候选图网格 │       │
│  │ (评论选取) │ │ (评论选取) │       │
│  └───────────┘ └───────────┘       │
├─────────────────────────────────────┤
│  视频管理                           │
│  [选中视频播放器]                    │
│  候选视频列表（评论+选取）           │
│  上传视频按钮                        │
├─────────────────────────────────────┤
│  关联实体                           │
│  场景变体: 咖啡厅 → 夜晚版          │
│  角色形象: 张小妹·日常装, 李明·正装 │
│  道具变体: 家族戒指·特写版           │
├─────────────────────────────────────┤
│  分镜评论                           │
│  [CommonCommentThread for storyboard]│
└─────────────────────────────────────┘
```

### 6.3 分镜编辑 Sheet

保留轻量编辑：
- 基本信息：镜头类型、描述、台词、动作、音乐、时长、运动、转场
- 新增：场景变体级联选择（场景→变体）
- 新增：角色形象多选（角色→形象）
- 新增：道具变体多选（道具→变体）
- 去掉图片/视频管理（移到详情页）

---

## 七、数据库变更

### 7.1 storyboards 表变更

```sql
ALTER TABLE storyboards
  ADD COLUMN scene_variant_id uuid REFERENCES scene_variants(id) ON DELETE SET NULL;
```

原有 `scene_id` 保留。设置 `scene_variant_id` 时自动同步 `scene_id`。

### 7.2 新建 storyboard_character_looks 中间表

```sql
CREATE TABLE storyboard_character_looks (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  storyboard_id   uuid NOT NULL REFERENCES storyboards(id) ON DELETE CASCADE,
  character_look_id uuid NOT NULL REFERENCES character_looks(id) ON DELETE CASCADE,
  sort_order      integer DEFAULT 0,
  created_at      timestamp DEFAULT now(),
  UNIQUE(storyboard_id, character_look_id)
);
```

### 7.3 新建 storyboard_prop_variants 中间表

```sql
CREATE TABLE storyboard_prop_variants (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  storyboard_id   uuid NOT NULL REFERENCES storyboards(id) ON DELETE CASCADE,
  prop_variant_id uuid NOT NULL REFERENCES prop_variants(id) ON DELETE CASCADE,
  sort_order      integer DEFAULT 0,
  created_at      timestamp DEFAULT now(),
  UNIQUE(storyboard_id, prop_variant_id)
);
```

### 7.4 新建 prop_variants 表

见第五节。

---

## 八、评论系统扩展

### 8.1 支持 asset 级别评论

1. 确认后端不拦截 `entity_type = 'asset'`
2. 候选图/视频 hover 操作增加「评论」按钮
3. 点击后在详情页内展开评论区域（内嵌 CommonCommentThread）
4. 批量查询评论数显示在缩略图角标

### 8.2 移除实体级评论

- 角色卡片去掉"评论"按钮
- 场景卡片去掉"评论"按钮
- 道具卡片去掉"评论"按钮
- 删除相关 Sheet 代码

注：分镜级别评论保留（在详情页底部）。

---

## 九、封面选择逻辑统一

```
coverAsset = 有 is_cover → 取它（绿色边框 + 星标）
           | 无 is_cover 但有候选 → created_at 最新（虚线边框 + "未选定"）
           | 无候选 → null（灰色空占位）
```

---

## 十、API 变更

### 10.1 分镜 CRUD 扩展

请求体新增：
```json
{
  "scene_variant_id": "uuid | null",
  "character_look_ids": ["uuid"],
  "prop_variant_ids": ["uuid"]
}
```

响应扩展：
```json
{
  "scene_variant": { "id", "name", "scene_id", "scene_name" },
  "character_looks": [{ "id", "name", "character_id", "character_name" }],
  "prop_variants": [{ "id", "name", "prop_id", "prop_name" }]
}
```

### 10.2 反查分镜 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects/:pid/characters/:cid/storyboards` | 角色关联的分镜 |
| GET | `/api/projects/:pid/scenes/:sid/storyboards` | 场景关联的分镜 |
| GET | `/api/projects/:pid/props/:propId/storyboards` | 道具关联的分镜 |

### 10.3 道具变体 CRUD API

见第五节。

### 10.4 评论 API

无需修改，`entity_type + entity_id` 天然支持 `entity_type = 'asset'`。

---

## 十一、前端组件变更

### 11.1 EntityImageGallery 增强

- 每张候选图/视频增加「评论」按钮（气泡+数量角标）
- 批量加载评论计数
- 封面逻辑改为 created_at DESC
- 区分"已确认选定"和"默认最新"视觉状态

### 11.2 新组件：EntityThumbnailRow

缩略图横排，用于列表页卡片。

Props: `items`, `maxVisible` (默认5), `size` ('sm'|'md')
Event: `@click(item)`

溢出处理：当 items 超过 maxVisible 时，右侧显示翻页箭头按钮，点击可滚动查看下一页。不使用 `+N` 标记，而是提供左右翻页操作。

### 11.3 新组件：ReferenceImageGallery

参考图管理，轻量版——仅上传、查看大图、删除。

Props: `projectId`, `entityType`, `entityId`

### 11.4 列表页修改

- characters.vue：去掉评论、去掉展开/收起、加 EntityThumbnailRow
- scenes.vue：同上
- scenes.vue（道具 tab）：同上，加 EntityThumbnailRow 显示道具变体

### 11.5 新增详情页

- characters/[cid].vue
- scenes/[sid].vue
- props/[propId].vue（或在 scenes 下通过 tab 区分）
- episodes/[num]/storyboards/[sbid].vue

### 11.6 分镜组件修改

- StoryboardCard.vue：新布局 + 关联信息展示
- StoryboardFormDialog.vue：关联选择 + 去掉图片管理

---

## 十二、MCP 工具更新

- 分镜工具：增加 scene_variant_id, character_look_ids, prop_variant_ids
- 新增：prop_variant 工具（list/create/update/delete）
- SKILL.md 更新

---

## 十三、文件变更清单

| 文件 | 变更 | 说明 |
|------|------|------|
| `migrations/20260322100000_prop_variants_storyboard_assoc.ts` | 新增 | prop_variants + storyboard 中间表 + scene_variant_id |
| `app/core/types/prop-variant.ts` | 新增 | PropVariant 类型 |
| `app/core/types/storyboard.ts` | 修改 | 关联字段 |
| `app/core/models/prop-variant.model.ts` | 新增 | CRUD |
| `app/core/models/storyboard-character-look.model.ts` | 新增 | 中间表 |
| `app/core/models/storyboard-prop-variant.model.ts` | 新增 | 中间表 |
| `app/core/services/prop-variant.service.ts` | 新增 | 业务逻辑 |
| `app/core/services/storyboard.service.ts` | 修改 | 关联处理 |
| `server/schemas/prop-variant.ts` | 新增 | 验证 |
| `server/schemas/storyboard.ts` | 修改 | 新字段 |
| `server/api/.../props/:propId/variants/` | 新增 | CRUD 路由 |
| `server/api/.../characters/:cid/storyboards.get.ts` | 新增 | 反查 |
| `server/api/.../scenes/:sid/storyboards.get.ts` | 新增 | 反查 |
| `server/api/.../props/:propId/storyboards.get.ts` | 新增 | 反查 |
| `app/components/project/EntityThumbnailRow.vue` | 新增 | 缩略图横排 |
| `app/components/project/ReferenceImageGallery.vue` | 新增 | 参考图管理 |
| `app/components/project/EntityImageGallery.vue` | 修改 | 评论 + 封面 |
| `app/pages/projects/[id]/characters.vue` | 修改 | 卡片改造 |
| `app/pages/projects/[id]/characters/[cid].vue` | 新增 | 详情页 |
| `app/pages/projects/[id]/scenes.vue` | 修改 | 卡片改造 |
| `app/pages/projects/[id]/scenes/[sid].vue` | 新增 | 详情页 |
| `app/pages/projects/[id]/props/[propId].vue` | 新增 | 详情页 |
| `app/components/project/StoryboardCard.vue` | 修改 | 新布局 |
| `app/components/project/StoryboardFormDialog.vue` | 修改 | 关联选择 |
| `app/pages/projects/[id]/episodes/[num]/storyboards.vue` | 修改 | 传递关联 |
| `app/pages/projects/[id]/episodes/[num]/storyboards/[sbid].vue` | 新增 | 详情页 |
| `mcp/tools/prop-variant-tools.ts` | 新增 | MCP 工具 |
| `mcp/tools/storyboard-tools.ts` | 修改 | 关联参数 |
| `mcp/server.ts` | 修改 | 注册新工具 |
| `skills/SKILL.md` | 修改 | 更新说明 |

---

## 十四、不做的事情（YAGNI）

- 不做图片对比模式（留到后续）
- 不做候选图投票/评分系统
- 不做图片版本历史
- 不做审批流程状态机
- 不做角色形象/场景变体/道具变体之间的直接关联
