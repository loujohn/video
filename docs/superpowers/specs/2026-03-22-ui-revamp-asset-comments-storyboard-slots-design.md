# UI 改造 + 图片级评论 + 分镜 Slot + 实体关联

## 概述

改造角色、场景、分镜三个页面的展示方式，使其更直观地呈现视觉素材；将评论系统下沉到图片/视频级别；增强分镜的多关键帧 slot 支持；建立分镜与角色形象、场景变体的关联关系；为角色、场景和分镜新增独立详情页面。

---

## 一、页面导航架构

### 1.1 新增详情页

| 路由 | 页面 | 用途 |
|------|------|------|
| `/projects/:pid/characters/:cid` | 角色详情页 | 完整角色信息 + 形象管理 + 关联分镜 |
| `/projects/:pid/scenes/:sid` | 场景详情页 | 完整场景信息 + 变体管理 + 关联分镜 |
| `/projects/:pid/episodes/:num/storyboards/:sbid` | 分镜详情页 | 完整分镜信息 + slot管理 + 视频管理 + 关联实体 |

### 1.2 列表页与详情页的关系

采用 **Sheet（快捷编辑）+ 详情页（完整视图）双通道** 模式：

- 卡片操作栏：「编辑」→ Sheet 快速修改基本信息；「详情」→ 跳转详情页；「删除」→ 确认对话框
- 也可以点击卡片主体区域直接跳转详情页
- Sheet 仅用于轻量级基本信息编辑（名称、描述、提示词等）
- 所有深度操作（候选图管理、评论、关联、slot管理）都在详情页中完成

---

## 二、角色改造

### 2.1 角色列表卡片

**卡片正面**：
- 保留角色名称、身份、性格标签
- 去掉角色级"评论"按钮
- 新增「形象缩略图横排」区域：每个形象显示圆角缩略图（选中图 or 最新候选图 or 空占位），下方带形象名称
- 缩略图尺寸约 48x48 ~ 56x56，横排最多显示 5 个，多于 5 个显示 `+N`
- 点击缩略图或卡片主体 → 跳转角色详情页

**卡片操作栏**：「编辑」（Sheet）| 「详情」（跳转）| 「删除」

### 2.2 角色详情页 `/projects/:pid/characters/:cid`

**布局**：

```
┌─────────────────────────────────────┐
│  ← 返回角色列表          编辑 | 删除│
├─────────────────────────────────────┤
│  角色名·身份·年龄                    │
│  性格标签 | 外貌描述 | 动机 | 口头禅│
│  AI提示词                           │
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
- 展开后显示：选中图大图 + 候选图网格 + 上传 + 编辑名称/提示词
- 候选图 hover 操作：选取（星标）、评论（气泡+数量）、废弃
- 可添加/删除形象（基础形象不可删）

**关联分镜区**：
- 显示所有使用该角色形象的分镜列表（从 storyboard_character_looks 反查）
- 每个分镜项显示：序号、集数、缩略图（slot1 选中图）

### 2.3 封面选择逻辑

- 有 `metadata.is_cover = true` → 选中图（绿色边框 + 星标）
- 无 is_cover 但有候选图 → 最新一张（created_at DESC），虚线边框表示"未确认选定"
- 无候选图 → 灰色空占位图标

---

## 三、场景改造

### 3.1 场景列表卡片

与角色采用相同模式：

- 保留场景名称、类型标签
- 去掉场景/道具级"评论"按钮
- 新增「变体缩略图横排」
- 点击 → 跳转场景详情页

### 3.2 场景详情页 `/projects/:pid/scenes/:sid`

**布局**：

```
┌─────────────────────────────────────┐
│  ← 返回场景列表          编辑 | 删除│
├─────────────────────────────────────┤
│  场景名·内/外景·时间                │
│  描述 | 标签 | AI提示词             │
├─────────────────────────────────────┤
│  变体管理                    + 添加  │
│  ┌──────────────────────────┐       │
│  │ 夜晚版 [天气]             │       │
│  │ [选中大图]                │       │
│  │ 候选图网格（评论+选取）   │       │
│  └──────────────────────────┘       │
├─────────────────────────────────────┤
│  关联分镜                           │
│  #01 第1集 | #03 第1集 ...          │
└─────────────────────────────────────┘
```

变体管理交互与角色形象管理完全一致。

---

## 四、分镜改造

### 4.1 分镜列表卡片

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
│  ▶ 选中视频缩略图           │  ← 视频区（有视频时显示）
├─────────────────────────────┤
│  角色: 张小妹·日常装 李明·正装│ ← 关联信息
│  场景: 咖啡厅·夜晚版         │
├─────────────────────────────┤
│  画面描述文字...             │
│  「台词...」                 │
├─────────────────────────────┤
│  💬2    编辑 | 详情 | 🗑️    │  ← 操作栏
└─────────────────────────────┘
```

- 点击卡片主体 → 跳转分镜详情页
- 编辑 → Sheet 修改基本信息

### 4.2 分镜详情页 `/projects/:pid/episodes/:num/storyboards/:sbid`

**布局**：

```
┌─────────────────────────────────────┐
│  ← 返回分镜列表      上一个 | 下一个│
├─────────────────────────────────────┤
│  #01 · 近景 · 推镜头 · 直切 · 5秒  │
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
├─────────────────────────────────────┤
│  画面描述: ...                      │
│  台词: ...                          │
│  动作指示: ...                      │
│  音效/音乐: ...                     │
│  AI提示词: ...                      │
├─────────────────────────────────────┤
│  分镜评论                           │
│  [CommonCommentThread for storyboard]│
└─────────────────────────────────────┘
```

**关键帧管理**：
- 每个 slot 一个可折叠 section
- 选中图大图 + 候选图网格 + 评论 + 选取 + 废弃 + 上传
- "添加关键帧"按钮 → 创建新 slot（自动递增 slot 号）
- slot 可删除（删除该 slot 的所有 asset）

**视频管理**：
- 选中视频用播放器展示
- 候选视频列表：缩略图 + 评论 + 选取 + 废弃
- 上传视频按钮

**关联实体**：
- 显示当前关联的场景变体和角色形象
- 可编辑关联（内联选择器或 Sheet）

### 4.3 分镜编辑 Sheet

保留现有 StoryboardFormDialog 作为快捷编辑：
- 基本信息：镜头类型、描述、台词、动作、音乐、时长、运动、转场
- 新增：场景变体级联选择（场景→变体）
- 新增：角色形象多选（角色→形象）
- 去掉 Sheet 中的图片/视频管理（这些移到详情页）

---

## 五、数据库变更

### 5.1 storyboards 表变更

```sql
ALTER TABLE storyboards
  ADD COLUMN scene_variant_id uuid REFERENCES scene_variants(id) ON DELETE SET NULL;
```

原有 `scene_id` 保留兼容。如果设置了 `scene_variant_id`，`scene_id` 自动从变体推导并同步写入。

### 5.2 新建 storyboard_character_looks 中间表

```sql
CREATE TABLE storyboard_character_looks (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  storyboard_id   uuid NOT NULL REFERENCES storyboards(id) ON DELETE CASCADE,
  character_look_id uuid NOT NULL REFERENCES character_looks(id) ON DELETE CASCADE,
  sort_order      integer DEFAULT 0,
  created_at      timestamp DEFAULT now(),
  UNIQUE(storyboard_id, character_look_id)
);

CREATE INDEX idx_scl_storyboard ON storyboard_character_looks(storyboard_id);
CREATE INDEX idx_scl_look ON storyboard_character_looks(character_look_id);
```

---

## 六、评论系统扩展

### 6.1 支持 asset 级别评论

现有评论系统已支持 `entity_type + entity_id` 的通用模式。只需要：

1. 确认 `entity_type = 'asset'` 在后端不被拦截
2. 在候选图/视频 hover 操作中增加「评论」按钮
3. 点击后在详情页内打开评论区域或 Sheet
4. 复用 CommonCommentThread（`entity_type='asset', entity_id=asset.id`）

### 6.2 评论数量显示

- 候选图/视频缩略图上显示评论数角标
- 通过批量查询 comment counts API（复用 `/api/projects/:pid/comments/counts`）

### 6.3 移除实体级评论

- 角色卡片去掉"评论"按钮
- 场景卡片去掉"评论"按钮
- 道具卡片去掉"评论"按钮
- 删除相关 Sheet 代码

注：分镜级别评论保留（在详情页底部），因为分镜作为整体可能需要讨论。

---

## 七、封面选择逻辑统一

所有候选图/视频场景统一封面选择逻辑：

```
coverAsset = 有 is_cover 的 → 取它（绿色边框 + 星标角标）
           | 无 is_cover 但有候选 → 取 created_at 最新的（虚线边框 + "未选定"标记）
           | 无候选 → null（灰色空占位图标）
```

现有代码中 `coverAsset` 的 `starred || active[0]` 改为按 `created_at DESC` 排序取第一个。

---

## 八、API 变更

### 8.1 分镜 CRUD 扩展

**创建/更新请求体新增**：
```json
{
  "scene_variant_id": "uuid | null",
  "character_look_ids": ["uuid", "uuid"]
}
```

**查询响应扩展**：
```json
{
  "id": "...",
  "scene_variant_id": "...",
  "scene_variant": { "id": "...", "name": "咖啡厅-夜晚", "scene_id": "...", "scene_name": "咖啡厅" },
  "character_looks": [
    { "id": "...", "name": "日常装", "character_id": "...", "character_name": "张小妹" }
  ]
}
```

### 8.2 分镜 slot 管理

slot 是 asset 的 `metadata.slot` 字段值，不需要独立 API。

- 上传图片时指定 `metadata.slot = N`
- 前端根据 slot 值分组显示
- "添加关键帧"即上传新图时使用 `max(slot) + 1` 作为 slot 值

### 8.3 角色/场景反查分镜 API

需要新增 API 从角色或场景反查关联的分镜列表：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects/:pid/characters/:cid/storyboards` | 列出使用该角色任意形象的分镜 |
| GET | `/api/projects/:pid/scenes/:sid/storyboards` | 列出使用该场景任意变体的分镜 |

### 8.4 评论 API

无需修改——现有 `entity_type + entity_id` 机制天然支持 `entity_type = 'asset'`。

---

## 九、前端组件变更

### 9.1 EntityImageGallery 增强

新增功能：
- 每张候选图/视频增加「评论」按钮（气泡图标 + 评论数角标）
- 点击评论按钮 → 打开内嵌 Sheet with CommonCommentThread
- 批量加载评论计数（`entity_type='asset'`）
- 封面逻辑改为 created_at DESC，区分"已确认选定"和"默认最新"

### 9.2 新组件：EntityThumbnailRow

用于列表页卡片中的缩略图横排显示。

Props:
- `items: Array<{ id, name, coverUrl?: string }>`
- `maxVisible?: number` (默认 5)
- `size?: 'sm' | 'md'` (默认 'md')

点击事件：`@click(item)`

### 9.3 角色列表页 (characters.vue)

- 去掉评论按钮和评论 Sheet
- 去掉展开/收起形象列表交互
- 集成 EntityThumbnailRow 显示形象缩略图
- 卡片点击/详情按钮 → 跳转详情页
- 编辑按钮 → Sheet 修改基本信息

### 9.4 角色详情页 (characters/[cid].vue) — 新增

- 完整角色信息展示 + inline 编辑
- 形象管理（可折叠 section，每个含 EntityImageGallery）
- 角色关系展示
- 关联分镜列表

### 9.5 场景列表页 (scenes.vue)

- 去掉评论按钮和评论 Sheet
- 去掉展开/收起变体列表交互
- 集成 EntityThumbnailRow

### 9.6 场景详情页 (scenes/[sid].vue) — 新增

- 完整场景信息 + 变体管理
- 关联分镜列表

### 9.7 分镜卡片 (StoryboardCard.vue)

- 新布局：选中关键帧横排 + 视频缩略图 + 关联实体信息
- 新增 props: `characterLooks`, `sceneVariant`
- 操作栏增加「详情」按钮

### 9.8 分镜详情页 (storyboards/[sbid].vue) — 新增

- 完整分镜信息
- 关键帧 slot 管理（动态添加/删除，每个 slot 有 EntityImageGallery）
- 视频管理
- 关联实体编辑
- 分镜评论

### 9.9 分镜编辑 Sheet (StoryboardFormDialog.vue)

- 保留基本信息编辑
- 新增场景变体级联选择
- 新增角色形象多选
- 去掉 Sheet 中的图片/视频管理（移到详情页）

---

## 十、MCP 工具更新

### 10.1 分镜工具更新

`create_storyboard` 和 `update_storyboard` 增加参数：
- `scene_variant_id?: string`
- `character_look_ids?: string[]`

### 10.2 SKILL.md 更新

更新分镜相关命令说明，增加关联实体用法。

---

## 十一、文件变更清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `migrations/20260322100000_storyboard_associations.ts` | 新增 | storyboard_character_looks 表 + scene_variant_id 列 |
| `app/core/types/storyboard.ts` | 修改 | 增加关联字段 |
| `app/core/models/storyboard-character-look.model.ts` | 新增 | 中间表 CRUD |
| `app/core/services/storyboard.service.ts` | 修改 | 处理 character_look_ids |
| `server/schemas/storyboard.ts` | 修改 | 新增字段验证 |
| `server/api/.../storyboards` | 修改 | join 关联数据 |
| `server/api/.../characters/:cid/storyboards.get.ts` | 新增 | 反查分镜 |
| `server/api/.../scenes/:sid/storyboards.get.ts` | 新增 | 反查分镜 |
| `app/components/project/EntityThumbnailRow.vue` | 新增 | 缩略图横排 |
| `app/components/project/EntityImageGallery.vue` | 修改 | 评论 + 封面逻辑 |
| `app/pages/projects/[id]/characters.vue` | 修改 | 卡片改造 |
| `app/pages/projects/[id]/characters/[cid].vue` | 新增 | 角色详情页 |
| `app/pages/projects/[id]/scenes.vue` | 修改 | 卡片改造 |
| `app/pages/projects/[id]/scenes/[sid].vue` | 新增 | 场景详情页 |
| `app/components/project/StoryboardCard.vue` | 修改 | 新布局 |
| `app/components/project/StoryboardFormDialog.vue` | 修改 | 关联选择 |
| `app/pages/projects/[id]/episodes/[num]/storyboards.vue` | 修改 | 传递关联数据 |
| `app/pages/projects/[id]/episodes/[num]/storyboards/[sbid].vue` | 新增 | 分镜详情页 |
| `mcp/tools/storyboard-tools.ts` | 修改 | 关联参数 |
| `skills/SKILL.md` | 修改 | 更新说明 |

---

## 十二、不做的事情（YAGNI）

- 不做图片对比模式（留到后续）
- 不做候选图投票/评分系统
- 不做图片版本历史
- 不做审批流程状态机
- 不做角色形象与场景变体之间的直接关联
