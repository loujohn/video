# 短剧管理平台 API 文档

## 认证

所有 API（除注册、登录外）需在 Header 中附带 `Authorization: Bearer {token}`。

成功响应格式：`{ "success": true, "data": ... }`  
错误格式：`{ "error": true, "statusCode": N, "statusMessage": "..." }`（或由框架抛出）

---

## 认证

### POST /api/auth/register

用户注册。

**Request Body:**
```json
{
  "email": "string",
  "name": "string",
  "password": "string"
}
```

**必填字段：** `email`, `name`, `password`

**Response:** `{ "success": true, "data": { "user": {...}, "token": "..." } }`

---

### POST /api/auth/login

用户登录。

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**必填字段：** `email`, `password`

**Response:** `{ "success": true, "data": { "user": {...}, "token": "..." } }`

---

### POST /api/auth/logout

用户登出。

**Response:** `{ "success": true, "data": ... }`

---

### GET /api/auth/me

获取当前登录用户信息。

**Response:** `{ "success": true, "data": { "user": {...} } }`

---

## 项目

### GET /api/projects

列出当前用户的所有项目。

**Response:** `{ "success": true, "data": [...] }`

---

### POST /api/projects

创建新项目。

**Request Body:**
```json
{
  "title": "string",
  "team_id": "string",
  "genre": ["string"],
  "audience": "string",
  "tone": "string",
  "total_episodes": 0,
  "mode": "domestic | overseas",
  "language": "zh-CN | en-US"
}
```

**必填字段：** `title`, `team_id`

**Response:** `{ "success": true, "data": { "id": "...", ... } }`

---

### GET /api/projects/:id

获取项目详情。

**Response:** `{ "success": true, "data": { "id": "...", ... } }`

---

### PUT /api/projects/:id

更新项目信息。

**Request Body:**
```json
{
  "title": "string",
  "genre": ["string"],
  "audience": "string",
  "tone": "string",
  "ending_type": "string",
  "total_episodes": 0,
  "status": "string",
  "mode": "string",
  "language": "string"
}
```

**Response:** `{ "success": true, "data": {...} }`

---

## 创作方案

### GET /api/projects/:id/plan

获取项目创作方案。

**Response:** `{ "success": true, "data": { "content": {...}, "version": 0, ... } }`

---

### PUT /api/projects/:id/plan

保存创作方案。

**Request Body:**
```json
{
  "content": { "core_concept": "...", "logline": "...", "theme": "...", ... },
  "change_summary": "string"
}
```

**必填字段：** `content`

**Response:** `{ "success": true, "data": {...} }`

---

## 角色

### GET /api/projects/:id/characters

列出项目中的所有角色。

**Response:** `{ "success": true, "data": [...] }`

---

### POST /api/projects/:id/characters

创建新角色。

**Request Body:**
```json
{
  "name": "string",
  "age": 0,
  "appearance": "string",
  "personality_tags": ["string"],
  "public_identity": "string",
  "real_identity": "string",
  "motivation": "string",
  "conflict_point": "string",
  "catchphrase": "string",
  "arc_description": "string",
  "villain_level": 0
}
```

**必填字段：** `name`

**Response:** `{ "success": true, "data": { "id": "...", ... } }`

---

### GET /api/projects/:id/characters/:cid

获取角色详情。

**Response:** `{ "success": true, "data": {...} }`

---

### PUT /api/projects/:id/characters/:cid

更新角色信息。

**Request Body:** 同创建，字段可选。

**Response:** `{ "success": true, "data": {...} }`

---

### DELETE /api/projects/:id/characters/:cid

删除角色。

**Response:** `{ "success": true, "data": ... }`

---

### GET /api/projects/:id/character-relations

获取角色关系列表。

**Response:** `{ "success": true, "data": [...] }`

---

### PUT /api/projects/:id/character-relations

批量设置角色关系。

**Request Body:**
```json
{
  "relations": [
    {
      "from_character_id": "string",
      "to_character_id": "string",
      "relation_type": "string",
      "description": "string"
    }
  ]
}
```

**必填字段：** `relations`（数组，每项需 `from_character_id`, `to_character_id`, `relation_type`）

**Response:** `{ "success": true, "data": [...] }`

---

## 场景

### GET /api/projects/:id/scenes

列出项目中的所有场景。

**Response:** `{ "success": true, "data": [...] }`

---

### POST /api/projects/:id/scenes

创建新场景。

**Request Body:**
```json
{
  "name": "string",
  "location_type": "interior | exterior",
  "time_of_day": "day | night | dawn | dusk",
  "description": "string",
  "tags": ["string"]
}
```

**必填字段：** `name`

**Response:** `{ "success": true, "data": { "id": "...", ... } }`

---

### GET /api/projects/:id/scenes/:sid

获取场景详情。

**Response:** `{ "success": true, "data": {...} }`

---

### PUT /api/projects/:id/scenes/:sid

更新场景信息。

**Request Body:** 同创建，字段可选。

**Response:** `{ "success": true, "data": {...} }`

---

### DELETE /api/projects/:id/scenes/:sid

删除场景。

**Response:** `{ "success": true, "data": ... }`

---

## 道具

### GET /api/projects/:id/props

列出项目中的所有道具。

**Response:** `{ "success": true, "data": [...] }`

---

### POST /api/projects/:id/props

创建新道具。

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "tags": ["string"]
}
```

**必填字段：** `name`

**Response:** `{ "success": true, "data": { "id": "...", ... } }`

---

### GET /api/projects/:id/props/:pid

获取道具详情。

**Response:** `{ "success": true, "data": {...} }`

---

### PUT /api/projects/:id/props/:pid

更新道具信息。

**Request Body:** 同创建，字段可选。

**Response:** `{ "success": true, "data": {...} }`

---

### DELETE /api/projects/:id/props/:pid

删除道具。

**Response:** `{ "success": true, "data": ... }`

---

## 分集

### GET /api/projects/:id/episodes

列出项目中的所有分集。

**Response:** `{ "success": true, "data": [...] }`

---

### POST /api/projects/:id/episodes

创建新分集。

**Request Body:**
```json
{
  "episode_number": 1,
  "title": "string",
  "synopsis": "string",
  "hook_type": "string",
  "is_key_episode": false,
  "is_paywall": false,
  "act": 1,
  "rhythm_phase": "string"
}
```

**必填字段：** `episode_number`

**Response:** `{ "success": true, "data": {...} }`

---

### GET /api/projects/:id/episodes/:num

获取分集详情。

**Response:** `{ "success": true, "data": {...} }`

---

### PUT /api/projects/:id/episodes/:num

更新分集信息。

**Request Body:** 同创建，字段可选。

**Response:** `{ "success": true, "data": {...} }`

---

### DELETE /api/projects/:id/episodes/:num

删除分集。

**Response:** `{ "success": true, "data": ... }`

---

## 剧本

### GET /api/projects/:id/episodes/:num/scripts

获取分集最新剧本。

**Response:** `{ "success": true, "data": { "content": "...", "version": 0, ... } }`

---

### POST /api/projects/:id/episodes/:num/scripts

保存分集剧本（自动创建版本）。

**Request Body:**
```json
{
  "content": "string",
  "change_summary": "string"
}
```

**必填字段：** `content`

**Response:** `{ "success": true, "data": {...} }`

---

## 分镜

### GET /api/projects/:id/episodes/:num/storyboards

列出分集中的所有分镜。

**Response:** `{ "success": true, "data": [...] }`

---

### POST /api/projects/:id/episodes/:num/storyboards

创建新分镜。

**Request Body:**
```json
{
  "shot_type": "close | medium | wide | pov | establishing",
  "description": "string",
  "dialogue": "string",
  "action_direction": "string",
  "music_cue": "string",
  "duration_seconds": 0,
  "camera_movement": "string",
  "transition_type": "cut | dissolve | fade | wipe",
  "scene_id": "string"
}
```

**Response:** `{ "success": true, "data": { "id": "...", ... } }`

---

### GET /api/projects/:id/episodes/:num/storyboards/:sid

获取分镜详情。

**Response:** `{ "success": true, "data": {...} }`

---

### PUT /api/projects/:id/episodes/:num/storyboards/:sid

更新分镜信息。

**Request Body:** 同创建，字段可选。

**Response:** `{ "success": true, "data": {...} }`

---

### DELETE /api/projects/:id/episodes/:num/storyboards/:sid

删除分镜。

**Response:** `{ "success": true, "data": ... }`

---

### PUT /api/projects/:id/episodes/:num/storyboards/reorder

调整分镜顺序。

**Request Body:**
```json
{
  "ids": ["id1", "id2", "id3", ...]
}
```

**必填字段：** `ids`（分镜 ID 数组，按新顺序排列）

**Response:** `{ "success": true, "data": { "reordered": true } }`

---

## 资源

### GET /api/projects/:id/assets

列出项目资源（图片/音频/视频）。

**Query Parameters:**
- `type`: `image` | `audio` | `video`（可选）
- `category`: 分类筛选（可选）
- `linked_entity_type`: 关联实体类型（可选）
- `linked_entity_id`: 关联实体 ID（可选）

**Response:** `{ "success": true, "data": [...] }`

---

### POST /api/projects/:id/assets

上传资源文件（multipart/form-data）。

**Form Fields:**
- `file`: 文件（必填）
- `type`: `image` | `audio` | `video`（可选，默认根据 MIME 推断）
- `category`: 分类（可选，默认 `general`）
- `linked_entity_type`: 关联实体类型（可选）
- `linked_entity_id`: 关联实体 ID（可选）

**Response:** `{ "success": true, "data": { "id": "...", "file_path": "...", ... } }`

---

### GET /api/projects/:id/assets/:aid

获取资源详情。

**Response:** `{ "success": true, "data": {...} }`

---

### PUT /api/projects/:id/assets/:aid

更新资源元信息（分类、关联等）。

**Request Body:**
```json
{
  "category": "string",
  "linked_entity_type": "string",
  "linked_entity_id": "string"
}
```

**Response:** `{ "success": true, "data": {...} }`

---

### DELETE /api/projects/:id/assets/:aid

删除资源。

**Response:** `{ "success": true, "data": ... }`

---

## 版本历史

### GET /api/projects/:id/versions

查看实体的版本历史。

**Query Parameters:**
- `entity_type`: `creative_plan` | `episode_script`（必填）
- `entity_id`: 实体 ID（必填）

**Response:** `{ "success": true, "data": [...] }`

---

## 静态文件

### GET /uploads/:path

访问上传的静态文件（图片、音频、视频等）。`path` 为资源存储的相对路径。
