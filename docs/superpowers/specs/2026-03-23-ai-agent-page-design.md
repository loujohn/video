# AI Agent 页面设计规格

## 概述

在 Drama Studio 中新增一个全局 AI Agent 页面，作为智能创作中枢。参照小云雀短剧 Agent 的工作流程，采用「流式对话 + 流程可视化」架构，让用户通过一个统一界面驱动从剧本到分镜的完整创作流程。AI 生成的所有内容实时同步到系统现有数据库。

## 设计原则

1. **Skills 作为编排层** — 复用已有 `skills/` 目录中的流程知识和 prompt 模板，AI 服务商和参数通过配置切换
2. **数据同步到系统** — AI 生成的剧本、分集、角色、场景、分镜全部通过现有 API 写入数据库
3. **混合模式** — 支持一键全流程自动和分步手动控制，任意阶段可暂停/修改/重新生成
4. **流式输出** — SSE 实时展示 AI 生成进度，用户即时看到结果

## 第一期范围

仅包含文本生成类功能，图片/视频生成接入留给后续迭代。

| 包含 | 不包含（后续） |
|------|---------------|
| Agent 页面基础架构 | 图片生成 API 集成 |
| AI 剧本生成（灵感 → 完整剧本） | 视频生成 API 集成 |
| AI 分集拆分 | 语音合成 |
| AI 角色/场景提取 | 视频合成 |
| AI 分镜脚本生成 | 实时协作编辑 |
| 后端 AI 编排服务 + SSE | |
| AI 设置页面（Provider 配置） | |
| 对话历史存储 | |

---

## 1. UI 布局

### 1.1 侧边栏入口

在 `AppSidebar.vue` 的导航项中新增「Agent」项，位于「项目」和「团队」之间。

```
navItems: [
  仪表盘 → /
  项目 → /projects
  Agent → /projects/:id/agent   ← 新增
  团队 → /teams
]
```

Agent 入口需要先选定项目才能使用（依赖项目上下文）。路由为 `/projects/:id/agent`，归属于项目子页面。侧边栏中通过 `ProjectSubNav` 组件展示，与其他项目子页面保持一致。

### 1.2 页面整体布局

```
┌─────────────────────────────────────────────────┐
│ Header: 项目名 + AI 创作助手 | 设置 | 一键生成   │
├─────────────────────────────────────────────────┤
│ Pipeline Bar:                                    │
│ [✓剧本] → [✓分集] → [●角色] → [场景] → [分镜]  │
│ → [生图] → [生视频] → [合成]                     │
├─────────────────────────────────────────────────┤
│                                                  │
│ Content Area (动态内容):                         │
│ 根据当前 pipeline 阶段展示对应的卡片列表         │
│                                                  │
├─────────────────────────────────────────────────┤
│ Chat Area (可折叠):                              │
│ AI 对话助手 · 随时修改和调整            ▼         │
│ [消息列表]                                       │
│ [输入框] [发送]                                   │
└─────────────────────────────────────────────────┘
```

### 1.3 Header

| 元素 | 说明 |
|------|------|
| 标题 | 「🤖 AI 创作助手」 |
| 项目名 badge | 显示当前项目名称，indigo-50 背景色 |
| 设置按钮 | 打开 AI 设置面板（Provider、模型、参数） |
| 一键生成按钮 | 渐变色主按钮，触发全流程自动生成 |

### 1.4 Pipeline Bar（流程进度条）

8 个阶段节点横向排列，箭头连接：

| 阶段 | ID | 图标 | 说明 |
|------|-----|------|------|
| 剧本 | script | 📝 | 从灵感生成完整剧本 |
| 分集 | episodes | 📋 | 从剧本自动拆分集数 |
| 角色 | characters | 👤 | 从剧本自动提取角色 |
| 场景 | scenes | 🏞️ | 从剧本自动提取场景 |
| 分镜 | storyboards | 🎬 | 从分集生成分镜脚本 |
| 生图 | images | 🖼️ | 生成关键帧图片（第二期） |
| 生视频 | videos | 📹 | 图生视频（第二期） |
| 合成 | composite | 🎞️ | 最终合成（第二期） |

**节点状态：**

| 状态 | 样式 | 说明 |
|------|------|------|
| completed | 绿色圆点 + 绿色文字 | 已完成并确认 |
| active | 紫色圆点（脉冲动画）+ 紫色背景 | 当前正在处理 |
| pending | 灰色圆点 | 尚未开始 |

用户可点击任意已完成或当前阶段节点跳转查看/重新生成。

### 1.5 Content Area（内容区）

根据当前 pipeline 阶段动态渲染不同内容：

**空状态（未开始）：**
- 居中显示 🎬 图标
- 「选择项目并开始 AI 创作」
- 「输入 / 开头的命令或使用"一键生成"按钮」

**有内容时：**
- 阶段标题 + 完成进度（如「已完成 2/4」）
- 操作按钮区：「全部重新生成」+「确认并继续 →」
- 卡片网格（auto-fill, minmax(240px, 1fr)）

**单个卡片结构：**

```
┌─────────────────────────────┐
│ [图片/图标区域] [状态 badge] │
│─────────────────────────────│
│ 名称                        │
│ 描述（2行截断）             │
│ [确认] [重新生成] [编辑] [详情]│
└─────────────────────────────┘
```

卡片状态 badge：
- `✓ 已确认` — emerald 背景
- `⏳ 生成中` — amber 背景
- `○ 待处理` — gray 背景

**各阶段的卡片内容映射：**

| 阶段 | 数据来源 | 卡片显示 | 「详情」跳转 |
|------|---------|---------|------------|
| 剧本 | `creative_plan` | 核心概念、故事线、风格圣经 | 创作方案页 |
| 分集 | `episodes` | 集数、标题、梗概 | 分集详情页 |
| 角色 | `characters` | 角色名、描述、性格标签 | 角色详情页 |
| 场景 | `scenes` | 场景名、类型、描述 | 场景详情页 |
| 分镜 | `storyboards`（按集分组） | 序号、镜头类型、描述 | 分镜详情页 |

### 1.6 Chat Area（对话区）

**折叠/展开：**
- 默认展开，高度 240px
- 点击顶部 toggle bar 折叠至 48px（只显示标题栏）
- 折叠时箭头旋转 180°

**消息类型：**

| 类型 | 样式 | 说明 |
|------|------|------|
| AI 消息 | 左对齐，灰色背景气泡，紫色 AI 头像 | AI 回复 |
| 用户消息 | 右对齐，indigo 背景气泡，绿色用户头像 | 用户输入 |
| 结果卡片 | 白色卡片嵌入 AI 消息中 | 显示生成结果摘要 |
| 流式指示器 | 三个脉冲圆点 | AI 正在生成中 |

**结果卡片：**
嵌入在 AI 消息中，包含：
- 标题（如「📝 角色更新 · 洛风」）
- 内容摘要
- 操作按钮：「✓ 采纳」「↻ 重新生成」「✏️ 修改」

**输入框：**
- placeholder: 「输入消息，或使用 / 命令...」
- Enter 发送，Shift+Enter 换行
- 支持 / 命令自动补全（与 skills 命令体系一致）

---

## 2. 后端 AI 编排服务

### 2.1 架构

```
AgentController (API Layer)
  │
  ├─ AgentService (编排层)
  │    ├─ SkillLoader — 读取 skills/ 文件作为 prompt 模板
  │    ├─ ContextBuilder — 从数据库拉取项目上下文
  │    ├─ LLMClient — 调用 AI 服务（可切换 Provider）
  │    └─ DataSyncer — 解析 AI 输出并写入数据库
  │
  ├─ SSE Stream — 实时推送生成进度到前端
  │
  └─ ConversationStore — 对话历史存储
```

### 2.2 API 端点

#### 对话流式端点

```
POST /api/projects/:id/agent/chat
Content-Type: application/json
Accept: text/event-stream

Body:
{
  "message": "从灵感生成剧本",
  "conversation_id": "uuid",        // 可选，复用已有对话
  "stage": "script",                  // 可选，指定阶段
  "auto_continue": false              // 是否自动继续下一阶段
}

Response: SSE stream
  event: message
  data: {"type": "text", "content": "正在分析你的灵感...", "delta": "正在"}

  event: message
  data: {"type": "result_card", "title": "📝 剧本生成", "content": {...}, "actions": ["adopt", "regenerate", "edit"]}

  event: message
  data: {"type": "data_synced", "entity_type": "creative_plan", "entity_id": "xxx"}

  event: message
  data: {"type": "stage_complete", "stage": "script", "next_stage": "episodes"}

  event: done
  data: {}
```

#### 一键生成端点

```
POST /api/projects/:id/agent/auto-generate
Content-Type: application/json
Accept: text/event-stream

Body:
{
  "from_stage": "script",             // 从哪个阶段开始
  "to_stage": "storyboards",          // 到哪个阶段结束
  "conversation_id": "uuid",
  "input": "一个关于..."               // 初始灵感（仅 from_stage=script 时需要）
}

Response: SSE stream（同上，但自动推进各阶段）
```

#### 阶段操作端点

```
POST /api/projects/:id/agent/stage/:stage/regenerate
Body: { "entity_id": "xxx" }     // 可选，指定重新生成某个实体

POST /api/projects/:id/agent/stage/:stage/confirm
Body: { "entity_ids": ["xxx"] }  // 确认指定实体，或空 = 全部确认

GET /api/projects/:id/agent/status
Response: { "stages": { "script": "completed", "episodes": "completed", ... } }
```

#### 对话历史端点

```
GET /api/projects/:id/agent/conversations
Response: [{ "id": "uuid", "title": "...", "updated_at": "..." }]

GET /api/projects/:id/agent/conversations/:cid/messages
Response: [{ "role": "user"|"assistant", "content": "...", "timestamp": "..." }]
```

#### 设置端点

```
GET /api/projects/:id/agent/settings
PUT /api/projects/:id/agent/settings
Body: {
  "provider": "openai",
  "model": "gpt-4o",
  "api_key": "sk-...",              // 加密存储
  "temperature": 0.7,
  "max_tokens": 4096
}
```

### 2.3 Skills 编排流程

每个阶段执行时，AgentService 按以下流程工作：

```
1. 加载阶段对应的 skills 参考文件（见 SKILL.md 第5节）
2. 从数据库拉取项目上下文（项目信息、已有角色、场景等）
3. 组装 system prompt = skills 模板 + 项目上下文
4. 调用 LLM API（streaming）
5. 解析 LLM 输出为结构化数据
6. 通过现有 API/Model 写入数据库
7. 通过 SSE 推送进度和结果到前端
```

**各阶段的 Skills 映射：**

| 阶段 | 加载的 Skills 文件 | 数据库写入操作 |
|------|-------------------|---------------|
| 剧本 | `satisfaction-matrix.md`, `visual-style-guide.md`, `genre-guide.md` | `save_creative_plan` |
| 分集 | `rhythm-curve.md`, `hook-design.md`, `paywall-design.md` | `create_episode` × N |
| 角色 | `villain-design.md`, `character-image-guide.md` | `create_character` × N, `set_character_relations` |
| 场景 | `visual-style-guide.md` | `create_scene` × N |
| 分镜 | `storyboard-guide.md`, `visual-style-guide.md`, `opening-rules.md` | `create_storyboard` × N |

### 2.4 LLM Provider 抽象层

```typescript
interface LLMProvider {
  id: string
  name: string
  chat(params: ChatParams): AsyncIterable<ChatChunk>
}

interface ChatParams {
  model: string
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
  response_format?: 'text' | 'json'
}

interface ChatChunk {
  type: 'text_delta' | 'text_done'
  content: string
}
```

内置 Provider 实现：
- `OpenAIProvider` — 支持 GPT-4o、GPT-4o-mini
- `AnthropicProvider` — 支持 Claude 3.5/4
- `CustomProvider` — 支持任意 OpenAI 兼容 API（如 DeepSeek、Qwen 等）

Provider 配置存储在 `agent_settings` 表中，每个项目可以有不同的配置。

### 2.5 数据同步机制

AI 输出经过结构化解析后，调用现有 Model 层写入数据库：

```
AI 输出 (JSON/Markdown)
  ↓
OutputParser — 解析为结构化数据
  ↓
DataSyncer — 调用现有 Model
  ├─ CreativePlanModel.save()
  ├─ EpisodeModel.create()
  ├─ CharacterModel.create()
  ├─ SceneModel.create()
  ├─ StoryboardModel.create()
  └─ 等...
```

LLM 被要求以 JSON 格式输出，OutputParser 负责验证和转换。字段映射遵循现有数据模型的 `CreateXxxInput` 接口。

---

## 3. 数据库扩展

### 3.1 新增表

#### agent_conversations

存储 AI 对话会话。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | 会话 ID |
| project_id | uuid FK → projects | 所属项目 |
| title | varchar(255) | 会话标题（自动生成或用户命名） |
| created_by | uuid FK → users | 创建者 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

#### agent_messages

存储对话消息。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | 消息 ID |
| conversation_id | uuid FK → agent_conversations | 所属会话 |
| role | varchar(20) | 'user' \| 'assistant' \| 'system' |
| content | text | 消息内容 |
| metadata | jsonb | 附加数据（result_card、data_synced 等） |
| created_at | timestamp | 创建时间 |

#### agent_settings

存储每个项目的 AI 配置。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | 设置 ID |
| project_id | uuid FK → projects (unique) | 所属项目 |
| provider | varchar(50) | AI 服务商标识 |
| model | varchar(100) | 模型名称 |
| api_key_encrypted | text | 加密存储的 API Key |
| temperature | decimal(3,2) | 温度参数，默认 0.7 |
| max_tokens | integer | 最大 token 数，默认 4096 |
| extra_config | jsonb | 其他配置（base_url 等） |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

#### agent_pipeline_status

存储每个项目的 pipeline 阶段状态。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | 状态 ID |
| project_id | uuid FK → projects | 所属项目 |
| stage | varchar(50) | 阶段 ID（script/episodes/characters/scenes/storyboards） |
| status | varchar(20) | 'pending' \| 'generating' \| 'completed' \| 'confirmed' |
| entity_count | integer | 该阶段生成的实体数量 |
| confirmed_count | integer | 已确认的实体数量 |
| last_generated_at | timestamp | 最后生成时间 |
| updated_at | timestamp | 更新时间 |

UNIQUE(project_id, stage)

---

## 4. 前端组件结构

### 4.1 页面

```
app/pages/projects/[id]/agent.vue      — Agent 主页面
```

### 4.2 组件

```
app/components/agent/
  ├── AgentPipelineBar.vue         — 流程进度条
  ├── AgentContentArea.vue         — 动态内容区
  ├── AgentChatPanel.vue           — 对话面板（可折叠）
  ├── AgentChatMessage.vue         — 单条消息
  ├── AgentResultCard.vue          — 结果卡片（嵌入消息中）
  ├── AgentEntityCard.vue          — 实体卡片（角色/场景/分镜等）
  ├── AgentEmptyState.vue          — 空状态提示
  ├── AgentSettingsDialog.vue      — AI 设置对话框
  └── AgentStageContent.vue        — 阶段内容渲染（按阶段类型选择模板）
```

### 4.3 Composables

```
app/composables/
  ├── useAgentChat.ts              — 管理对话状态、SSE 连接、消息发送
  ├── useAgentPipeline.ts          — 管理 pipeline 状态、阶段切换
  └── useAgentSettings.ts          — 管理 AI 设置
```

### 4.4 前端状态管理

```typescript
// useAgentChat.ts
interface AgentChatState {
  conversationId: string | null
  messages: AgentMessage[]
  isStreaming: boolean
  streamingContent: string
}

// useAgentPipeline.ts
interface AgentPipelineState {
  stages: Record<string, StageStatus>
  activeStage: string | null
  stageEntities: Record<string, StageEntity[]>
}

interface StageEntity {
  id: string
  name: string
  description: string
  status: 'done' | 'generating' | 'pending'
  entityType: string
  entityId: string  // 对应数据库中的实际 entity ID
}
```

---

## 5. AI 设置面板

### 5.1 布局

以 Dialog/Sheet 形式展示，包含：

| 设置项 | 类型 | 说明 |
|--------|------|------|
| AI 服务商 | Select | OpenAI / Anthropic / 自定义 |
| 模型 | Select（动态加载） | gpt-4o, gpt-4o-mini, claude-3.5-sonnet, claude-4 等 |
| API Key | Password Input | 加密存储 |
| API Base URL | Text Input | 仅自定义 Provider 时显示 |
| Temperature | Slider (0-2) | 默认 0.7 |
| Max Tokens | Number Input | 默认 4096 |

### 5.2 安全

- API Key 使用 AES-256-GCM 加密存储
- 加密密钥从环境变量 `AGENT_ENCRYPTION_KEY` 读取
- 前端永远只显示 `sk-...****`（掩码）
- 后端传输时不返回完整 Key

---

## 6. 对话流交互细节

### 6.1 用户发送消息

1. 用户在输入框输入文本，按 Enter 发送
2. 消息显示在对话区右侧
3. 前端建立 SSE 连接到 `/api/projects/:id/agent/chat`
4. AI 回复流式展示（逐字显示）
5. 如果 AI 执行了数据库操作（创建角色等），发送 `data_synced` 事件
6. 前端收到 `data_synced` 后刷新 Content Area 中的对应卡片

### 6.2 一键生成流程

1. 用户点击「一键生成」
2. 弹出确认对话框：显示将要执行的阶段范围
3. 如果是全新项目，要求输入灵感/主题
4. 前端建立 SSE 连接到 `/api/projects/:id/agent/auto-generate`
5. 后端按顺序执行每个阶段
6. 每个阶段完成后发送 `stage_complete` 事件
7. 前端更新 Pipeline Bar 和 Content Area
8. 用户可随时点击「暂停」中断自动流程

### 6.3 重新生成

1. 用户点击卡片上的「↻ 重新生成」
2. 发送 POST 到 `/api/projects/:id/agent/stage/:stage/regenerate`
3. 后端重新调用 LLM 生成该实体
4. 结果通过 SSE 推送，前端更新卡片

### 6.4 确认并继续

1. 用户点击「确认并继续 →」
2. 发送 POST 到 `/api/projects/:id/agent/stage/:stage/confirm`
3. 后端标记该阶段为 confirmed
4. Pipeline Bar 该节点变为 completed
5. 自动跳转到下一阶段并开始生成

---

## 7. / 命令系统

对话输入框支持 `/` 命令，与 `skills/SKILL.md` 中定义的命令体系一致：

| 命令 | 阶段 | 说明 |
|------|------|------|
| /开始 | script | 选题定位，创建/选择项目 |
| /创作方案 | script | 生成故事骨架和风格圣经 |
| /角色开发 | characters | 生成角色档案和关系 |
| /目录 | episodes | 生成分集目录 |
| /分集 N | episodes | 生成第 N 集剧本 |
| /分镜 N | storyboards | 生成第 N 集分镜 |

输入 `/` 时弹出命令补全菜单，显示可用命令列表及简要说明。

---

## 8. 错误处理

| 场景 | 处理方式 |
|------|---------|
| API Key 未配置 | 引导用户到设置面板配置 |
| LLM API 调用失败 | 在对话区显示错误信息 + 重试按钮 |
| LLM 输出格式错误 | 尝试自动修复解析，失败则提示用户 |
| SSE 连接断开 | 自动重连（最多 3 次），失败则提示手动刷新 |
| 数据库写入失败 | 在对话区显示错误，保留 AI 输出供手动复制 |
| 并发生成冲突 | 同一项目同一阶段只允许一个生成任务 |

---

## 9. 文件结构总览

```
新增文件:
  app/pages/projects/[id]/agent.vue
  app/components/agent/AgentPipelineBar.vue
  app/components/agent/AgentContentArea.vue
  app/components/agent/AgentChatPanel.vue
  app/components/agent/AgentChatMessage.vue
  app/components/agent/AgentResultCard.vue
  app/components/agent/AgentEntityCard.vue
  app/components/agent/AgentEmptyState.vue
  app/components/agent/AgentSettingsDialog.vue
  app/components/agent/AgentStageContent.vue
  app/composables/useAgentChat.ts
  app/composables/useAgentPipeline.ts
  app/composables/useAgentSettings.ts
  server/api/projects/[id]/agent/chat.post.ts
  server/api/projects/[id]/agent/auto-generate.post.ts
  server/api/projects/[id]/agent/status.get.ts
  server/api/projects/[id]/agent/stage/[stage]/regenerate.post.ts
  server/api/projects/[id]/agent/stage/[stage]/confirm.post.ts
  server/api/projects/[id]/agent/conversations/index.get.ts
  server/api/projects/[id]/agent/conversations/[cid]/messages.get.ts
  server/api/projects/[id]/agent/settings/index.get.ts
  server/api/projects/[id]/agent/settings/index.put.ts
  server/services/agent/AgentService.ts
  server/services/agent/SkillLoader.ts
  server/services/agent/ContextBuilder.ts
  server/services/agent/LLMClient.ts
  server/services/agent/OutputParser.ts
  server/services/agent/DataSyncer.ts
  server/services/agent/providers/OpenAIProvider.ts
  server/services/agent/providers/AnthropicProvider.ts
  server/services/agent/providers/CustomProvider.ts
  app/core/models/agent-conversation.model.ts
  app/core/models/agent-message.model.ts
  app/core/models/agent-settings.model.ts
  app/core/models/agent-pipeline-status.model.ts
  app/core/types/agent.ts
  migrations/20260323200000_agent_tables.ts

修改文件:
  app/components/layout/AppSidebar.vue       — 新增 Agent 导航项
  app/components/project/ProjectSubNav.vue   — 新增 Agent 子导航项
```
