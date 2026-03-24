# AI Agent v2 设计规格

## 概述

在 Drama Studio 中新增一个**独立的 AI Agent 页面**（路由 `/agent`），作为智能创作中枢。核心理念是「LLM 自主决策 + Function Calling」——Agent 通过调用系统已有的 MCP tools 与平台交互，复用 `skills/SKILL.md` 作为 system prompt，无需硬编码 pipeline 逻辑。

## 设计原则

1. **对话为主体** — Agent 本质是对话式 AI，对话区占据主屏幕，侧边栏只做上下文参考
2. **Agentic Loop** — 类似 Claude Code / OpenClaw 的自主循环模式，LLM 自主决定调用多少 tools 直到任务完成
3. **Vercel AI SDK** — 使用 `ai` + `@ai-sdk/openai` + `@ai-sdk/anthropic` 作为核心框架
4. **Skills 插件化** — 可注册不同 Skills，每个 Skill 有独立的 system prompt、references 和 tool 白名单
5. **复用现有资产** — MCP tools schema 自动转为 LLM function definitions，Skills 目录作为知识库
6. **混合模式** — 支持自然语言对话 + `/命令` 精确控制
7. **渐进式复杂度** — 第一期聚焦核心对话能力，后续迭代加持久化、图片/视频生成等

---

## 第一期范围

| 包含 | 不包含（后续） |
|------|---------------|
| Agent 页面（独立路由 `/agent`） | 对话持久化/历史 |
| 全屏对话式布局 + 可折叠侧边栏 | 图片/视频生成 API 集成 |
| 后端 AgentService（LLM + Function Calling） | 一键全流程自动生成 |
| LLM Provider 抽象（OpenAI 兼容 + Anthropic） | /命令自动补全菜单 |
| 复用 MCP tools 作为 function definitions | 多用户并发 |
| SKILL.md + references 作为 system prompt | |
| SSE 流式响应 | |
| Tool 调用可视化（可切换展开/简洁） | |
| 项目选择/自动创建 | |
| 全局 LLM 设置面板 | |
| 对话 session 内存储（刷新重置） | |

---

## 1. 页面布局

### 1.1 路由

```
/agent — Agent 独立页面（不嵌套在项目下）
```

在 `AppSidebar.vue` 导航中新增「Agent」项，位于「项目」和「团队」之间。

### 1.2 整体布局

```
┌─────┬──────────────────────────────┬────────────┐
│ App │ Chat Header                  │ Context    │
│ Side├──────────────────────────────┤ Sidebar    │
│ bar │                              │            │
│     │ Chat Messages (full screen)  │ • 项目信息  │
│     │ • AI 回复（含 tool 可视化）    │ • Pipeline │
│     │ • 用户消息                    │ • 实体列表  │
│     │ • 嵌入式结果卡片              │            │
│     │                              │            │
│     ├──────────────────────────────┤            │
│     │ Input Area                   │            │
└─────┴──────────────────────────────┴────────────┘
```

- **Chat Area**: 主体区域，对话式交互
- **Context Sidebar**: 280px 宽，可折叠，显示项目上下文和流程进度

### 1.3 Chat Header

| 元素 | 说明 |
|------|------|
| 标题 | 「AI 创作助手」+ 机器人图标 |
| 项目选择器 | 下拉选择已有项目，或通过对话自动关联 |
| 侧边栏切换 | 展开/折叠 Context Sidebar |
| 设置按钮 | 打开 LLM 设置面板 |

### 1.4 Chat Messages

消息区域占据全部可用空间，居中对齐（max-width: 720px），类似 ChatGPT 布局。

**消息类型：**

| 类型 | 样式 |
|------|------|
| AI 消息 | 浅灰背景，紫色 AI 头像，左对齐 |
| 用户消息 | 无背景，绿色用户头像，左对齐 |
| Tool 调用块 | 嵌入 AI 消息中，可折叠的卡片 |
| 结果卡片 | 嵌入 AI 消息中，操作按钮卡片 |
| 流式指示器 | 三个脉冲圆点 |

### 1.5 Tool 调用可视化

默认**简洁模式**，只显示 tool 名称和状态（✓ 完成 / ⏳ 执行中）。

点击可**展开**查看 tool 的输入参数和返回结果。

```
┌──────────────────────────────────────────────┐
│ 📦 create_character              ✓ 完成  ▸   │
├──────────────────────────────────────────────┤
│ { name: "洛风", description: "..." }         │  ← 展开后显示
│ → 角色创建成功，ID: chr_001                   │
└──────────────────────────────────────────────┘
```

### 1.6 结果卡片

Tool 执行产生的重要实体（角色、分镜等）以结果卡片形式展示：

```
┌──────────────────────────────────────────────┐
│ 👤 角色档案 · 洛风                            │
├──────────────────────────────────────────────┤
│ 核心性格：...                                 │
│ 角色弧光：...                                 │
├──────────────────────────────────────────────┤
│ [✓ 采纳]  [↻ 重新生成]  [✏️ 修改]            │
└──────────────────────────────────────────────┘
```

操作按钮：
- **采纳**: 确认该内容（更新 UI 状态）
- **重新生成**: 发送消息让 AI 重新生成该实体
- **修改**: 发送消息让 AI 根据用户反馈修改

### 1.7 Input Area

- placeholder: 「描述你的创意，或输入 /命令...」
- Enter 发送，Shift+Enter 换行
- 输入框自适应高度（max 120px）

### 1.8 Context Sidebar（可折叠）

分为三个区域：

**项目信息区：**
- 项目名、题材、集数、模式
- 未选择项目时显示提示

**创作流程区（Pipeline）：**
- 7 个阶段纵向排列：创作方案 → 分集目录 → 角色开发 → 场景设计 → 分镜脚本 → 图片生成 → 视频生成
- 状态：done（绿色）/ active（紫色脉冲）/ pending（灰色）
- 非强制流程，只做可视化参考

**实体列表区：**
- 显示当前活跃阶段的实体列表
- 包含名称、状态 badge

### 1.9 空状态

未开始对话时，居中显示：
- 🤖 图标
- 「AI 创作助手」标题
- 「告诉我你的创意灵感...」描述
- 建议 chips：「创建一个武侠短剧」「都市甜宠10集」等

---

## 2. 后端架构

### 2.1 技术栈

- **Vercel AI SDK** (`ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`)
- Agentic Loop 通过 `streamText` + `maxSteps` 实现
- Tool 定义使用 AI SDK 的 `tool()` 函数

### 2.2 AgentService

```
POST /api/agent/chat → SSE Handler
  │
  ├─ SkillLoader — 加载 skill 的 SKILL.md + references
  ├─ ToolRegistry — MCP tools → AI SDK tool definitions
  ├─ Vercel AI SDK streamText()
  │   ├─ model: openai/anthropic (基于设置)
  │   ├─ system: skill prompt + project context
  │   ├─ tools: registered tools
  │   ├─ maxSteps: 20 (最多 20 轮 tool 调用)
  │   └─ onStepFinish: 推送进度到 SSE
  │
  └─ SSE Stream → 前端
```

### 2.3 Agentic Loop

Vercel AI SDK 内置支持 multi-step tool calling：

```typescript
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

const result = streamText({
  model: openai('gpt-4o'),
  system: skillPrompt + projectContext,
  messages: history,
  tools: registeredTools,
  maxSteps: 20,  // 最多 20 轮自主决策
  onStepFinish: ({ stepType, toolCalls, toolResults }) => {
    // 每完成一步，推送到 SSE
  }
})
```

LLM 会自主循环：
```
用户消息 → LLM 思考 → 调用 tool_1 → 获取结果 → LLM 继续思考 
→ 调用 tool_2 → 获取结果 → ... → LLM 输出最终回复
```

### 2.4 API 端点

#### 对话端点

```
POST /api/agent/chat
Content-Type: application/json
Accept: text/event-stream

Body:
{
  "message": "创建一个武侠短剧",
  "project_id": "uuid" | null,
  "skill_id": "drama-writer",
  "history": [...]
}

Response: Vercel AI SDK data stream format
  0:"好的，"
  0:"我来"
  9:{"toolCallId":"tc1","toolName":"create_project","args":{...}}
  a:{"toolCallId":"tc1","result":"..."}
  0:"项目已创建..."
  e:{"finishReason":"stop"}
  d:{"finishReason":"stop","usage":{...}}
```

#### Skills 端点

```
GET /api/agent/skills
Response: [{ id, name, description, icon }]
```

#### LLM 设置端点

```
GET /api/agent/settings
PUT /api/agent/settings
```

### 2.5 ToolRegistry

从 MCP tools 自动转换为 Vercel AI SDK 的 tool 格式：

```typescript
import { tool } from 'ai'
import { z } from 'zod'

function mcpToolToAiTool(mcpTool, handler) {
  return tool({
    description: mcpTool.description,
    parameters: jsonSchemaToZod(mcpTool.inputSchema),
    execute: async (args) => {
      return await handler(mcpTool.name, args)
    }
  })
}
```

Tool 执行通过内部 HTTP 调用系统 API（与 MCP server 相同方式）。

### 2.6 SkillLoader

```typescript
interface Skill {
  id: string
  name: string
  description: string
  icon: string
  tools: string[] | '*'   // 可用 tools 白名单
  systemPrompt: string     // SKILL.md 内容
  references: string[]     // reference 文件列表
}

async function loadSkill(skillId: string): Promise<Skill> {
  const dir = `skills/${skillId}`
  const meta = JSON.parse(await readFile(`${dir}/skill.json`))
  const prompt = await readFile(`${dir}/SKILL.md`)
  return { ...meta, systemPrompt: prompt }
}
```

### 2.7 Skills 目录结构

```
skills/
  drama-writer/              ← 当前的 SKILL.md 重组为一个 skill
    ├── SKILL.md
    ├── skill.json
    └── references/
        ├── genre-guide.md
        ├── rhythm-curve.md
        └── ...（12 个参考文件）
```

第一期先将现有的 `skills/SKILL.md` 和 `skills/references/` 组织为 `drama-writer` skill。

---

## 3. 数据库

### 3.1 新增表

#### agent_settings（全局 LLM 配置）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| provider | varchar(50) | 'openai' \| 'anthropic' \| 'custom' |
| model | varchar(100) | 模型名称 |
| api_key_encrypted | text | AES-256-GCM 加密存储 |
| base_url | varchar(500) | 自定义 API 地址（OpenAI 兼容） |
| temperature | decimal(3,2) | 默认 0.7 |
| max_tokens | integer | 默认 4096 |
| created_at | timestamp | |
| updated_at | timestamp | |

第一期只有一行（全局配置），不关联项目。

---

## 4. 前端组件

### 4.1 页面

```
app/pages/agent.vue — Agent 主页面
```

### 4.2 组件

```
app/components/agent/
  ├── AgentChatMessage.vue       — 单条消息（AI / User）
  ├── AgentToolCallBlock.vue     — Tool 调用可视化块（可折叠）
  ├── AgentResultCard.vue        — 结果卡片（带操作按钮）
  ├── AgentContextSidebar.vue    — 右侧上下文侧边栏
  ├── AgentPipelineMini.vue      — 纵向 Pipeline 进度
  ├── AgentEmptyState.vue        — 空状态提示
  ├── AgentSettingsDialog.vue    — LLM 设置对话框
  └── AgentProjectSelector.vue   — 项目选择下拉
```

### 4.3 Composable

```
app/composables/useAgentChat.ts — 管理对话状态、SSE 连接、消息历史
```

### 4.4 前端状态

```typescript
interface AgentState {
  projectId: string | null
  messages: AgentMessage[]
  isStreaming: boolean
  streamingContent: string
  sidebarVisible: boolean
  pipelineStages: Record<string, 'done' | 'active' | 'pending'>
  stageEntities: Record<string, EntitySummary[]>
}

interface AgentMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolCalls?: ToolCallInfo[]
  resultCards?: ResultCardInfo[]
  timestamp: number
}

interface ToolCallInfo {
  id: string
  name: string
  arguments: Record<string, unknown>
  result?: string
  status: 'running' | 'done' | 'error'
}

interface ResultCardInfo {
  title: string
  icon: string
  body: string
  entityType: string
  entityId: string
  actions: ('adopt' | 'regenerate' | 'edit')[]
}
```

---

## 5. LLM 设置面板

以 Dialog 形式展示：

| 设置项 | 类型 | 说明 |
|--------|------|------|
| AI 服务商 | Select | OpenAI / Anthropic / 自定义（OpenAI 兼容） |
| 模型 | Select | gpt-4o, claude-4-sonnet 等 |
| API Key | Password Input | 加密存储，前端显示掩码 |
| API Base URL | Text Input | 仅自定义时显示 |
| Temperature | Slider (0-2) | 默认 0.7 |
| Max Tokens | Number Input | 默认 4096 |

API Key 使用 AES-256-GCM 加密，密钥从环境变量 `AGENT_ENCRYPTION_KEY` 读取。

---

## 6. 交互流程

### 6.1 首次使用

1. 用户进入 `/agent`
2. 检查 LLM 设置是否已配置
3. 未配置 → 引导打开设置面板
4. 已配置 → 显示空状态 + 建议 chips

### 6.2 自然语言创建项目

1. 用户输入「创建一个武侠短剧」
2. 前端发送 POST /api/agent/chat（无 project_id）
3. LLM 决定调用 `list_teams` + `create_project`
4. SSE 推送 tool 调用过程
5. 前端收到新 project_id，更新项目选择器和侧边栏
6. LLM 继续回复，提示下一步

### 6.3 选择已有项目继续

1. 用户通过项目选择器选择项目
2. 侧边栏加载项目信息和 pipeline 状态
3. 用户输入「继续角色开发」
4. 前端发送 POST /api/agent/chat（带 project_id）
5. PromptBuilder 注入项目上下文
6. LLM 读取项目状态，继续对应阶段工作

### 6.4 /命令精确控制

1. 用户输入 `/分镜 1`
2. 前端将命令作为普通消息发送
3. LLM 识别命令，执行 SKILL.md 中定义的对应流程
4. 按顺序调用多个 tools，前端实时显示 tool 调用过程

### 6.5 采纳/重新生成/修改

- **采纳**: 前端更新卡片状态，不需要后端操作（数据已通过 tool 写入）
- **重新生成**: 发送消息「重新生成洛风的角色设定」→ LLM 调用 update_character
- **修改**: 发送消息「把洛风的年龄改为18岁」→ LLM 调用 update_character

---

## 7. 错误处理

| 场景 | 处理方式 |
|------|---------|
| API Key 未配置 | 对话区显示引导卡片，点击打开设置 |
| LLM API 调用失败 | 对话中显示错误 + 重试按钮 |
| Tool 执行失败 | tool 块显示错误状态，LLM 会看到错误并尝试修复 |
| SSE 连接断开 | 自动重连，失败则提示手动刷新 |
| Token 超限 | 自动截断早期对话历史 |

---

## 8. 文件结构

```
新增:
  app/pages/agent.vue
  app/components/agent/AgentChatMessage.vue
  app/components/agent/AgentToolCallBlock.vue
  app/components/agent/AgentResultCard.vue
  app/components/agent/AgentContextSidebar.vue
  app/components/agent/AgentPipelineMini.vue
  app/components/agent/AgentEmptyState.vue
  app/components/agent/AgentSettingsDialog.vue
  app/components/agent/AgentProjectSelector.vue
  app/composables/useAgentChat.ts
  server/api/agent/chat.post.ts
  server/api/agent/settings.get.ts
  server/api/agent/settings.put.ts
  server/services/agent/AgentService.ts
  server/services/agent/PromptBuilder.ts
  server/services/agent/ToolRegistry.ts
  server/services/agent/LLMClient.ts
  server/services/agent/providers/OpenAICompatibleProvider.ts
  server/services/agent/providers/AnthropicProvider.ts
  server/utils/encryption.ts
  app/core/types/agent.ts
  migrations/20260324200000_agent_settings.ts

修改:
  app/components/layout/AppSidebar.vue — 新增 Agent 导航项
```

---

## 9. Mockup

参见 `docs/mockups/agent-page-v2-mockup.html`
