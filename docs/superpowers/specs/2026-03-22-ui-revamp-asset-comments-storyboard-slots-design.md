# UI 改造 + 图片级评论 + 分镜 Slot + 实体关联

## 概述

改造角色、场景、分镜三个页面的展示方式，使其更直观地呈现视觉素材；将评论系统下沉到图片/视频级别；增强分镜的多关键帧 slot 支持；建立分镜与角色形象、场景变体的关联关系。

---

## 一、角色卡片改造

### 1.1 现状问题

- 角色卡片只显示名称和文字信息，看不到任何图片
- 形象列表需要点击展开才能看到，展开后也是以文字列表 + 小网格展示
- 不够直观，无法一目了然地看到角色各形象的视觉效果

### 1.2 新设计

**卡片正面**：
- 保留角色名称、身份、性格标签
- 去掉角色级"评论"按钮
- 新增「形象缩略图横排」区域：每个形象显示一个圆角缩略图（选中图 or 最新候选图 or 空占位），下方带形象名称
- 缩略图尺寸约 48x48 ~ 56x56，横排最多显示 5 个，多于 5 个时右侧显示 `+N`

**点击形象缩略图** → 打开形象详情 Sheet：
- 顶部：选中图大图展示（约 300px 高）
- 中间：候选图网格（3 列）
  - 每张图上 hover 显示：选取按钮（星标）、评论按钮（气泡图标+数量）、废弃按钮
  - 选中图有绿色边框 + 星标角标
  - 无 is_cover 时默认显示最新候选图（created_at 最新），带"未选定"虚线边框标记
- 底部：上传按钮 + 形象信息编辑区（名称、提示词）

### 1.3 封面选择逻辑

- 有 `metadata.is_cover = true` 的 asset → 选中图
- 无 is_cover 但有候选图 → 最新一张（按 created_at DESC），显示虚线边框表示"未确认选定"
- 完全无候选图 → 灰色空占位图标

---

## 二、场景卡片改造

### 2.1 新设计

与角色卡片采用相同模式：

**卡片正面**：
- 保留场景名称、类型标签
- 去掉场景/道具级"评论"按钮
- 新增「变体缩略图横排」区域：每个变体显示选中图缩略图 + 变体名称

**点击变体缩略图** → 打开变体详情 Sheet，交互与角色形象详情相同。

---

## 三、分镜卡片改造

### 3.1 现状问题

- 分镜卡片的图片和视频以 EntityImageGallery 小网格显示，不够突出
- slot 逻辑在 UI 上没有实质体现
- 分镜与角色形象、场景变体没有关联

### 3.2 新设计 — 卡片正面

**布局**：
```
┌─────────────────────────────┐
│  #01  近景  推镜头  直切     │  ← Badge 行
├─────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐│
│  │ Slot1│ │ Slot2│ │ Slot3││  ← 选中关键帧横排（大图）
│  │  img │ │  img │ │  img ││
│  └──────┘ └──────┘ └──────┘│
├─────────────────────────────┤
│  ▶ 选中视频缩略图           │  ← 视频区（有视频时显示）
├─────────────────────────────┤
│  👤张小妹·日常装  👤李明·正装│  ← 关联角色形象（有关联时显示）
│  📍咖啡厅·夜晚版            │  ← 关联场景变体（有关联时显示）
├─────────────────────────────┤
│  画面描述文字...             │
│  「台词...」                 │
├─────────────────────────────┤
│  💬2         ✏️ 🗑️          │  ← 操作栏
└─────────────────────────────┘
```

- slot 区域：每个 slot 的选中图以等比缩放显示，横排排列
- 无选中图的 slot 显示灰色占位 + slot 序号
- 视频区：选中视频的第一帧缩略图 + 播放按钮叠加
- 关联实体区：小头像缩略图 + 名称

### 3.3 新设计 — 编辑表单

在现有 StoryboardFormDialog 中增加：

**关联选择区**：
- 「场景变体」：先选场景（下拉），再选变体（级联下拉）→ 存为 `scene_variant_id`
- 「角色形象」：多选控件，先选角色再选形象 → 存为 `storyboard_character_looks` 中间表

**关键帧管理区**：
- 显示当前所有 slot，每个 slot 一个缩略图 + 上传/查看候选按钮
- 「添加关键帧」按钮 → 创建新 slot
- 点击某个 slot → 打开该 slot 的候选图管理（与形象详情 Sheet 类似）

**视频管理区**：
- 候选视频列表 + 上传
- 每个候选视频可评论 + 选取

---

## 四、数据库变更

### 4.1 storyboards 表变更

```sql
ALTER TABLE storyboards
  ADD COLUMN scene_variant_id uuid REFERENCES scene_variants(id) ON DELETE SET NULL;
```

原有 `scene_id` 保留兼容，但 UI 改为优先使用 `scene_variant_id`。如果设置了 `scene_variant_id`，`scene_id` 自动从变体推导。

### 4.2 新建 storyboard_character_looks 中间表

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

## 五、评论系统扩展

### 5.1 支持 asset 级别评论

现有评论系统已支持 `entity_type + entity_id` 的通用模式。只需要：

1. 确认 `entity_type = 'asset'` 在后端不被拦截
2. 在 EntityImageGallery 的候选图 hover 操作中增加「评论」按钮
3. 点击后打开 Sheet，内嵌 CommonCommentThread 组件（`entity_type='asset', entity_id=asset.id`）

### 5.2 评论数量显示

- 在候选图缩略图上显示评论数量角标
- 通过批量查询 comment counts API 获取（复用现有 `/api/projects/:pid/comments/counts`）

### 5.3 移除实体级评论

- 角色卡片去掉"评论"按钮和相关 Sheet
- 场景卡片去掉"评论"按钮和相关 Sheet
- 道具卡片去掉"评论"按钮和相关 Sheet

---

## 六、封面选择逻辑统一

所有使用 EntityImageGallery 的场景统一封面选择逻辑：

```
coverAsset = 有 is_cover 的 → 取它
           | 无 is_cover 但有候选 → 取 created_at 最新的（显示"未选定"标记）
           | 无候选 → null（显示空占位）
```

现有代码中 `coverAsset` 已经实现 `starred || active[0]`，需要改为按 `created_at DESC` 排序取第一个，并在 UI 上区分"已确认选定"和"默认最新"两种状态。

---

## 七、API 变更

### 7.1 分镜 CRUD 扩展

**创建/更新分镜请求体新增字段**：
```json
{
  "scene_variant_id": "uuid | null",
  "character_look_ids": ["uuid", "uuid"]
}
```

**分镜查询响应扩展**：
```json
{
  "id": "...",
  "scene_variant_id": "...",
  "scene_variant": { "id": "...", "name": "咖啡厅-夜晚", "scene_id": "..." },
  "character_looks": [
    { "id": "...", "name": "日常装", "character_id": "...", "character_name": "张小妹" }
  ]
}
```

### 7.2 分镜 slot 管理

slot 不需要独立的 API。slot 是 asset 的 `metadata.slot` 字段值。

- 上传图片时指定 `metadata.slot = N`
- 前端根据 slot 值分组显示
- "添加关键帧"即在上传新图时使用 `max(slot) + 1` 作为 slot 值

### 7.3 评论 API

无需修改——现有 `entity_type + entity_id` 机制天然支持 `entity_type = 'asset'`。

---

## 八、前端组件变更

### 8.1 EntityImageGallery 增强

新增功能：
- 每张候选图增加「评论」按钮（气泡图标 + 评论数）
- 点击评论按钮 → 打开内嵌 Sheet with CommonCommentThread
- 批量加载评论计数（`entity_type='asset'`）
- 封面逻辑改为 `created_at DESC` 排序，区分"已确认"和"默认最新"两种视觉状态

### 8.2 新组件：EntityThumbnailRow

用于角色卡片和场景卡片的缩略图横排显示。

Props:
- `items: Array<{ id, name, coverUrl?: string }>`
- `maxVisible?: number` (默认 5)
- `size?: 'sm' | 'md'` (默认 'md')

输出：圆角缩略图横排 + 名称 + 溢出 `+N` 标记

点击事件：`@click(item)` 传递被点击的 item

### 8.3 角色页面 (characters.vue)

- 去掉评论按钮和评论 Sheet
- 去掉展开/收起形象列表的交互
- 在卡片内集成 EntityThumbnailRow 显示形象缩略图
- 点击形象缩略图 → 打开形象详情 Sheet（复用增强后的 EntityImageGallery）

### 8.4 场景页面 (scenes.vue)

- 去掉评论按钮和评论 Sheet
- 去掉展开/收起变体列表的交互
- 在卡片内集成 EntityThumbnailRow 显示变体缩略图
- 点击变体缩略图 → 打开变体详情 Sheet

### 8.5 分镜卡片 (StoryboardCard.vue)

- 重新布局：选中关键帧横排 + 视频缩略图 + 关联实体信息 + 文字描述
- 新增 props: `characterLooks`, `sceneVariant`

### 8.6 分镜表单 (StoryboardFormDialog.vue)

- 新增「场景变体」级联选择（场景 → 变体）
- 新增「角色形象」多选控件（角色 → 形象，可多选）
- 新增关键帧管理区（slot 列表 + 添加关键帧按钮）
- 每个 slot 可点击进入候选图管理

---

## 九、MCP 工具更新

### 9.1 分镜工具更新

`create_storyboard` 和 `update_storyboard` 增加参数：
- `scene_variant_id?: string`
- `character_look_ids?: string[]`

### 9.2 SKILL.md 更新

更新分镜相关命令说明，增加关联实体的用法。

---

## 十、文件变更清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `migrations/20260322100000_storyboard_associations.ts` | 新增 | storyboard_character_looks 表 + scene_variant_id 列 |
| `app/core/types/storyboard.ts` | 修改 | 增加 scene_variant_id, character_looks 字段 |
| `app/core/models/storyboard-character-look.model.ts` | 新增 | 中间表 CRUD |
| `app/core/services/storyboard.service.ts` | 修改 | 创建/更新时处理 character_look_ids |
| `server/schemas/storyboard.ts` | 修改 | 新增 scene_variant_id, character_look_ids 字段 |
| `server/api/.../storyboards` | 修改 | 查询时 join 关联数据 |
| `app/components/project/EntityThumbnailRow.vue` | 新增 | 缩略图横排组件 |
| `app/components/project/EntityImageGallery.vue` | 修改 | 增加评论功能、封面逻辑 |
| `app/pages/projects/[id]/characters.vue` | 修改 | 改造卡片布局 |
| `app/pages/projects/[id]/scenes.vue` | 修改 | 改造卡片布局 |
| `app/components/project/StoryboardCard.vue` | 修改 | 新布局+关联信息 |
| `app/components/project/StoryboardFormDialog.vue` | 修改 | 关联选择+slot管理 |
| `app/pages/projects/[id]/episodes/[num]/storyboards.vue` | 修改 | 传递新数据 |
| `mcp/tools/storyboard-tools.ts` | 修改 | 新增关联参数 |
| `skills/SKILL.md` | 修改 | 更新命令说明 |

---

## 十一、不做的事情（YAGNI）

- 不做图片对比模式（留到后续）
- 不做候选图投票/评分系统
- 不做图片版本历史
- 不做审批流程状态机
- 不做角色形象与场景变体之间的直接关联
