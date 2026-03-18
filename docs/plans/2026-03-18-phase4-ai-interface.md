# Phase 4: AI 接口层 — 实施计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 MCP Server、Skill 文件、References 知识库和 API 文档，使 AI 助手能够通过 MCP 工具或 REST API 与短剧管理平台交互，完成从选题到剧本的完整创作流程。

**Architecture:** MCP Server 作为独立 TypeScript 进程运行，通过 stdio 与 AI 客户端通信；内部通过 HTTP 调用平台 REST API。Skill 文件定义编剧角色、命令和 I/O 规范，指导 AI 优先使用 MCP 工具，否则通过 curl/fetch 调用 API。References 目录提供创作方法论参考。

**Tech Stack:** @modelcontextprotocol/sdk, TypeScript, Node.js, Nuxt 3 REST API (已有)

**Design Doc:** `docs/plans/2026-03-18-short-drama-platform-design.md`

**前置依赖:** Phase 1–2b 已完成。Phase 3（分镜、资源库）未完成时，`list_storyboards`、`create_storyboard`、`upload_asset`、`list_assets` 四个工具将返回 404，可先实现工具骨架，待 Phase 3 完成后对接。

**IMPORTANT - MCP 认证:** 平台 REST API 需要 `Authorization: Bearer {token}`。MCP Server 通过环境变量 `DRAMA_API_TOKEN` 获取 token，在每次 HTTP 请求中附带。

**IMPORTANT - API 响应格式:** 平台 API 返回 `{ success: true, data: T }`，MCP 工具应解析 `data` 字段返回给 AI。

---

## File Structure

```
mcp/
├── package.json                 # 新建: MCP 独立依赖（@modelcontextprotocol/sdk, zod）
├── tsconfig.json                # 新建: MCP 专用 TS 配置
├── server.ts                    # 新建: MCP Server 入口，注册工具、启动 stdio 传输
├── lib/
│   ├── api-client.ts            # 新建: 封装 HTTP 调用 REST API 的通用客户端
│   └── types.ts                 # 新建: MCP 工具参数/返回值类型
├── tools/
│   ├── project-tools.ts         # 新建: list_projects, create_project, get_project, update_project, save_creative_plan
│   ├── character-tools.ts       # 新建: list_characters, create_character, update_character, set_character_relations
│   ├── scene-prop-tools.ts      # 新建: list_scenes, create_scene, list_props, create_prop
│   ├── episode-tools.ts         # 新建: list_episodes, create_episode, save_episode_script, get_episode_script
│   ├── storyboard-tools.ts      # 新建: list_storyboards, create_storyboard（依赖 Phase 3）
│   ├── asset-tools.ts           # 新建: upload_asset, list_assets（依赖 Phase 3）
│   └── version-tools.ts         # 新建: get_version_history
├── index.ts                     # 新建: 可执行入口（tsx mcp/index.ts）
└── README.md                    # 新建: 安装、配置、运行说明

skills/
├── SKILL.md                     # 新建: 主 Skill 文件（角色、命令、API 配置、交互模式）
└── references/
    ├── genre-guide.md           # 新建: 13种题材 + 出海题材映射
    ├── opening-rules.md         # 新建: 开篇黄金法则
    ├── rhythm-curve.md          # 新建: 节奏曲线设计
    ├── hook-design.md           # 新建: 5种钩子类型
    ├── paywall-design.md        # 新建: 付费卡点策略
    ├── satisfaction-matrix.md   # 新建: 爽感矩阵
    ├── villain-design.md        # 新建: 四层反派体系
    ├── storyboard-guide.md      # 新建: 分镜设计指南
    └── visual-style-guide.md    # 新建: 视觉风格指南

docs/
├── api/                         # 新建: API 文档目录
│   └── openapi.yaml             # 新建: OpenAPI 3.0 规范（或 api-docs.md）
└── plans/
    └── 2026-03-18-phase4-ai-interface.md  # 本计划
```

---

## Batch 1: MCP Server 脚手架

### Task 1.1: MCP 依赖与配置

**Files:**
- Create: `mcp/package.json`
- Create: `mcp/tsconfig.json`

**mcp/package.json 内容：**

```json
{
  "name": "video-mcp-server",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "tsx server.ts",
    "dev": "tsx watch server.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.27.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "tsx": "^4.21.0",
    "typescript": "^5.9.0"
  }
}
```

**mcp/tsconfig.json 内容：**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "."
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 1:** 创建 `mcp/package.json`
- [ ] **Step 2:** 创建 `mcp/tsconfig.json`
- [ ] **Step 3:** 在项目根目录执行 `cd mcp && npm install`，确认依赖安装成功

### Task 1.2: API 客户端封装

**Files:**
- Create: `mcp/lib/api-client.ts`
- Create: `mcp/lib/types.ts`

**mcp/lib/api-client.ts 设计要点：**
- 从环境变量读取 `DRAMA_API_URL`（默认 `http://localhost:3000`）、`DRAMA_API_TOKEN`
- 提供 `get(path)`, `post(path, body)`, `put(path, body)` 方法
- 所有请求附带 `Authorization: Bearer ${DRAMA_API_TOKEN}`
- 解析响应 `{ success, data }`，失败时抛出包含 status 和 message 的错误

**mcp/lib/types.ts：** 定义工具参数的 Zod schema 及返回值类型（可后续逐步补充）

- [ ] **Step 1:** 创建 `mcp/lib/types.ts`（导出空对象或基础类型占位）
- [ ] **Step 2:** 创建 `mcp/lib/api-client.ts`，实现 `get/post/put` 及 Bearer 认证
- [ ] **Step 3:** 在 `mcp/server.ts` 中 import api-client，写一行 `console.log` 验证可加载（后续会替换为真实 Server）

### Task 1.3: MCP Server 入口骨架

**Files:**
- Create: `mcp/server.ts`

**设计要点：**
- 使用 `@modelcontextprotocol/sdk` 的 `Server` 类
- 使用 `StdioServerTransport` 作为传输层（与 Cursor/Claude 等客户端通过 stdio 通信）
- 注册空工具列表（占位），调用 `server.connect()` 启动
- 参考官方示例：<https://github.com/modelcontextprotocol/typescript-sdk>

**最小可运行示例结构：**

```typescript
// 注：SDK 1.x 使用 Server + setRequestHandler；2.x 可能使用 McpServer + registerTool，以实际安装版本为准
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

const server = new Server({ name: 'video-drama-mcp', version: '1.0.0' })

server.setRequestHandler('tools/list', async () => ({ tools: [] }))
server.setRequestHandler('tools/call', async () => ({
  content: [{ type: 'text', text: 'Not implemented' }]
}))

const transport = new StdioServerTransport()
await server.connect(transport)
console.error('Video Drama MCP Server running on stdio')
```

**SDK 版本说明：** 若使用 `@modelcontextprotocol/sdk` 2.x 或 `@modelcontextprotocol/server`，API 为 `McpServer` + `registerTool(name, schema, handler)`，参考 <https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/server.md>。

- [ ] **Step 1:** 创建 `mcp/server.ts`，实现最小 MCP Server（空工具列表）
- [ ] **Step 2:** 运行 `cd mcp && npm run start`，确认进程启动无报错（stdio 模式下会等待输入，可 Ctrl+C 退出）
- [ ] **Step 3:** 提交 Batch 1

```bash
git add mcp/
git commit -m "feat(mcp): add MCP server scaffold with api-client and stdio transport"
```

---

## Batch 2: MCP 工具实现

### Task 2.1: 项目与创作方案工具

**Files:**
- Create: `mcp/tools/project-tools.ts`
- Modify: `mcp/server.ts` — 注册 project-tools

**工具定义与 HTTP 映射：**

| 工具名 | 参数 | HTTP |
|--------|------|------|
| list_projects | 无 | GET /api/projects |
| create_project | title, team_id, genre?, audience?, tone?, total_episodes? | POST /api/projects |
| get_project | project_id | GET /api/projects/:id |
| update_project | project_id, title?, genre?, audience?, tone?, ending_type?, total_episodes?, status? | PUT /api/projects/:id |
| save_creative_plan | project_id, content (object), change_summary? | PUT /api/projects/:id/plan |

**实现要点：**
- 每个工具定义为 `{ name, description, inputSchema }`，inputSchema 使用 JSON Schema 格式（MCP 标准）
- 在 `tools/call` handler 中根据 `name` 分发到对应实现
- 使用 api-client 发起 HTTP 请求，解析 `data` 返回

- [ ] **Step 1:** 在 `mcp/tools/project-tools.ts` 实现 5 个工具的 schema 与调用逻辑
- [ ] **Step 2:** 在 `mcp/server.ts` 中 import 并注册 project-tools 到 `tools/list` 和 `tools/call`
- [ ] **Step 3:** 本地启动 Nuxt 平台 + 登录获取 token，设置 `DRAMA_API_TOKEN`，手动测试 `list_projects`（可用简单脚本或 MCP Inspector）

### Task 2.2: 角色工具

**Files:**
- Create: `mcp/tools/character-tools.ts`
- Modify: `mcp/server.ts`

**工具与 HTTP 映射：**

| 工具名 | 参数 | HTTP |
|--------|------|------|
| list_characters | project_id | GET /api/projects/:id/characters |
| create_character | project_id, name, age?, appearance?, personality_tags?, ... | POST /api/projects/:id/characters |
| update_character | project_id, character_id, name?, age?, ... | PUT /api/projects/:id/characters/:cid |
| set_character_relations | project_id, relations: [{ from_character_id, to_character_id, relation_type, description? }] | PUT /api/projects/:id/character-relations |

- [ ] **Step 1:** 实现 `mcp/tools/character-tools.ts`
- [ ] **Step 2:** 在 server.ts 中注册 character-tools

### Task 2.3: 场景与道具工具

**Files:**
- Create: `mcp/tools/scene-prop-tools.ts`
- Modify: `mcp/server.ts`

**工具与 HTTP 映射：**

| 工具名 | 参数 | HTTP |
|--------|------|------|
| list_scenes | project_id | GET /api/projects/:id/scenes |
| create_scene | project_id, name, location_type?, time_of_day?, description?, tags? | POST /api/projects/:id/scenes |
| list_props | project_id | GET /api/projects/:id/props |
| create_prop | project_id, name, description?, tags? | POST /api/projects/:id/props |

- [ ] **Step 1:** 实现 `mcp/tools/scene-prop-tools.ts`
- [ ] **Step 2:** 在 server.ts 中注册 scene-prop-tools

### Task 2.4: 分集与剧本工具

**Files:**
- Create: `mcp/tools/episode-tools.ts`
- Modify: `mcp/server.ts`

**工具与 HTTP 映射：**

| 工具名 | 参数 | HTTP |
|--------|------|------|
| list_episodes | project_id | GET /api/projects/:id/episodes |
| create_episode | project_id, episode_number, title?, synopsis?, hook_type?, ... | POST /api/projects/:id/episodes |
| save_episode_script | project_id, episode_number, content, change_summary? | POST /api/projects/:id/episodes/:num/scripts |
| get_episode_script | project_id, episode_number | GET /api/projects/:id/episodes/:num/scripts |

- [ ] **Step 1:** 实现 `mcp/tools/episode-tools.ts`
- [ ] **Step 2:** 在 server.ts 中注册 episode-tools

### Task 2.5: 分镜与资源工具（依赖 Phase 3）

**Files:**
- Create: `mcp/tools/storyboard-tools.ts`
- Create: `mcp/tools/asset-tools.ts`
- Modify: `mcp/server.ts`

**工具与 HTTP 映射（Phase 3 API 路径，以设计文档为准）：**

| 工具名 | 参数 | HTTP |
|--------|------|------|
| list_storyboards | project_id, episode_id? | GET /api/projects/:id/storyboards |
| create_storyboard | project_id, episode_id, sequence_number, shot_type?, description?, ... | POST /api/projects/:id/storyboards |
| upload_asset | project_id, file, type, category, linked_entity_type?, linked_entity_id? | POST /api/projects/:id/assets |
| list_assets | project_id, type?, category? | GET /api/projects/:id/assets |

**说明：** Phase 3 未完成时，这些工具会返回 404。实现时按设计文档的预期路径编写，便于 Phase 3 完成后直接对接。

- [ ] **Step 1:** 实现 `mcp/tools/storyboard-tools.ts`
- [ ] **Step 2:** 实现 `mcp/tools/asset-tools.ts`（upload 需处理 multipart/form-data）
- [ ] **Step 3:** 在 server.ts 中注册 storyboard-tools 和 asset-tools

### Task 2.6: 版本历史工具

**Files:**
- Create: `mcp/tools/version-tools.ts`
- Modify: `mcp/server.ts`

**工具与 HTTP 映射：**

| 工具名 | 参数 | HTTP |
|--------|------|------|
| get_version_history | project_id, entity_type, entity_id | GET /api/projects/:id/versions?entity_type=X&entity_id=Y |

**注意：** 实际 API 路径为 `GET /api/projects/:id/versions`，query 参数为 `entity_type` 和 `entity_id`。

- [ ] **Step 1:** 实现 `mcp/tools/version-tools.ts`
- [ ] **Step 2:** 在 server.ts 中注册 version-tools
- [ ] **Step 3:** 提交 Batch 2

```bash
git add mcp/
git commit -m "feat(mcp): implement all 22 MCP tools wrapping platform REST API"
```

---

## Batch 3: Skill 文件

### Task 3.1: SKILL.md 主文件

**Files:**
- Create: `skills/SKILL.md`

**核心结构（参考 short-drama + 设计文档）：**

1. **角色定义**
   - "你是一位专业的微短剧编剧，精通短视频平台的爆款短剧创作方法论。你将通过本平台的 MCP 工具或 REST API 与短剧管理平台交互，完成从选题到剧本的完整创作流程。"

2. **平台 API 配置**
   - 环境变量 `DRAMA_API_URL`：平台 API 根地址（如 `http://localhost:3000`）
   - 认证：需 Bearer Token，用户需在平台登录后配置 `DRAMA_API_TOKEN`

3. **与平台交互方式**
   - 优先使用 MCP Server（如已配置 video-drama-mcp）
   - 否则通过 `curl` 或 `fetch` 调用 REST API，需在请求头附带 `Authorization: Bearer {token}`

4. **命令定义**（与 short-drama 对齐，但操作对象为平台项目）

| 命令 | 功能 | 主要 MCP 工具 / API |
|------|------|---------------------|
| /开始 | 选题定位，创建/选择项目 | list_projects, create_project, get_project, update_project |
| /创作方案 | 生成故事骨架，保存创作方案 | save_creative_plan, get_project |
| /角色开发 | 生成角色档案与关系 | list_characters, create_character, update_character, set_character_relations |
| /目录 | 生成分集目录 | list_episodes, create_episode |
| /分集 N | 生成第 N 集剧本 | get_episode_script, save_episode_script, list_characters, list_scenes |
| /出海 | 切换出海模式 | update_project (mode: overseas, language: en-US) |

5. **每个命令的 I/O 规范**
   - 输入：用户选择/确认的字段
   - 输出：调用 MCP 工具或 API 后的结果摘要，以及下一步提示

6. **References 加载规则**
   - 进入对应阶段时，加载 `skills/references/` 下指定文件
   - 表格列出：文件 | 用途 | 加载时机

- [ ] **Step 1:** 创建 `skills/SKILL.md`，完成角色定义、API 配置、交互方式
- [ ] **Step 2:** 编写 6 个命令的完整 I/O 规范（/开始、/创作方案、/角色开发、/目录、/分集 N、/出海）
- [ ] **Step 3:** 编写 References 加载规则表格
- [ ] **Step 4:** 提交 Batch 3

```bash
git add skills/SKILL.md
git commit -m "feat(skills): add SKILL.md with role, commands and API integration"
```

---

## Batch 4: References 知识库

### Task 4.1: 题材与开篇

**Files:**
- Create: `skills/references/genre-guide.md`
- Create: `skills/references/opening-rules.md`

**genre-guide.md 内容要点：**
- 13 种主流短剧题材：霸道总裁、甜宠、萌宝、战神、重生、穿越、宫斗、赘婿、闪婚、萌宠、悬疑、虐恋、逆袭
- 每种：名称、一句话描述、核心受众、典型爽点
- 出海题材映射：中式题材 → ReelShort/DramaBox 对应元素（Billionaire, Werewolf, Secret Baby 等）

**opening-rules.md 内容要点：**
- 开篇黄金法则：前 30 秒/前 3 段必须抓住观众
- 6 种开场模板：冲突开场、悬念开场、反差开场、金句开场、画面冲击、身份揭秘

- [ ] **Step 1:** 创建 `skills/references/genre-guide.md`
- [ ] **Step 2:** 创建 `skills/references/opening-rules.md`

### Task 4.2: 节奏与钩子

**Files:**
- Create: `skills/references/rhythm-curve.md`
- Create: `skills/references/hook-design.md`

**rhythm-curve.md 内容要点：**
- 全剧节奏波形：起势 → 攀升 → 风暴 → 决战
- 单集微结构：开场钩子、中段推进、结尾悬念
- 紧张-舒缓交替原则

**hook-design.md 内容要点：**
- 5 种钩子类型：悬念钩、反转钩、情绪钩、信息钩、危机钩
- 每种的定义、适用场景、示例

- [ ] **Step 1:** 创建 `skills/references/rhythm-curve.md`
- [ ] **Step 2:** 创建 `skills/references/hook-design.md`

### Task 4.3: 付费与爽感

**Files:**
- Create: `skills/references/paywall-design.md`
- Create: `skills/references/satisfaction-matrix.md`

**paywall-design.md 内容要点：**
- 付费卡点策略：前 10 集至少 2 个卡点
- 卡点类型：身份揭秘、感情转折、危机爆发、反转前夜
- 悬念设计原则

**satisfaction-matrix.md 内容要点：**
- 5 大爽点类型：打脸、逆袭、宠溺、复仇、身份
- 每种的定义、强度分级、分布建议

- [ ] **Step 1:** 创建 `skills/references/paywall-design.md`
- [ ] **Step 2:** 创建 `skills/references/satisfaction-matrix.md`

### Task 4.4: 反派与视觉

**Files:**
- Create: `skills/references/villain-design.md`
- Create: `skills/references/storyboard-guide.md`
- Create: `skills/references/visual-style-guide.md`

**villain-design.md 内容要点：**
- 四层反派体系：小反派、中反派、大反派、隐藏反派
- 每层的功能、出场时机、与主角的冲突设计

**storyboard-guide.md 内容要点：**
- 分镜设计指南：景别选择、镜头语言、节奏控制
- 与剧本场次的对应关系

**visual-style-guide.md 内容要点：**
- 视觉风格指南：色调、光影、构图
- 不同题材的视觉差异（甜宠 vs 悬疑 vs 战神）

- [ ] **Step 1:** 创建 `skills/references/villain-design.md`
- [ ] **Step 2:** 创建 `skills/references/storyboard-guide.md`
- [ ] **Step 3:** 创建 `skills/references/visual-style-guide.md`
- [ ] **Step 4:** 提交 Batch 4

```bash
git add skills/references/
git commit -m "feat(skills): add 9 reference documents for drama creation methodology"
```

---

## Batch 5: API 文档与 MCP README

### Task 5.1: API 文档

**Files:**
- Create: `docs/api/api-docs.md` 或 `docs/api/openapi.yaml`

**方案 A：Markdown 文档**
- 按资源分组：Projects, Characters, Scenes, Props, Episodes, Scripts, Plan, Versions
- 每个端点：Method、Path、Request、Response、示例

**方案 B：OpenAPI 3.0**
- 使用 openapi.yaml 描述全部 API
- 可配合 Swagger UI 或 Redoc 生成可浏览文档

**建议：** 优先使用 Markdown（`api-docs.md`），便于与 Skill 文件交叉引用；若需自动化可补充 OpenAPI。

- [ ] **Step 1:** 创建 `docs/api/api-docs.md`，覆盖 Phase 1–2b 已实现的全部 API
- [ ] **Step 2:**（可选）创建 `docs/api/openapi.yaml` 基础结构

### Task 5.2: MCP README

**Files:**
- Create: `mcp/README.md`

**内容要点：**
- 简介：Video Drama MCP Server 的用途
- 安装：`cd mcp && npm install`
- 配置：`DRAMA_API_URL`、`DRAMA_API_TOKEN` 环境变量
- 运行：`npm run start` 或 `npm run dev`
- 在 Cursor 中配置 MCP：示例配置片段（stdio 模式）
- 工具列表：22 个工具的简要说明与参数

- [ ] **Step 1:** 创建 `mcp/README.md`
- [ ] **Step 2:** 提交 Batch 5

```bash
git add docs/api/ mcp/README.md
git commit -m "docs: add API documentation and MCP server README"
```

---

## 验证清单

完成所有 Batch 后验证：

- [ ] **MCP Server 启动：** `cd mcp && npm run start` 无报错，进程保持运行
- [ ] **认证：** 设置 `DRAMA_API_TOKEN` 后，`list_projects` 能正确返回项目列表
- [ ] **项目 CRUD：** 通过 MCP 工具创建项目、获取详情、更新、保存创作方案
- [ ] **角色流程：** 创建角色、更新角色、设置角色关系
- [ ] **场景道具：** 创建场景、创建道具、列表查询
- [ ] **分集剧本：** 创建分集、保存剧本、获取剧本
- [ ] **版本历史：** `get_version_history` 能返回创作方案或剧本的版本列表
- [ ] **Skill 文件：** SKILL.md 可被 AI 客户端加载，命令定义清晰
- [ ] **References：** 9 个参考文档存在且内容完整
- [ ] **API 文档：** api-docs.md 覆盖主要端点，便于人工查阅
- [ ] **MCP README：** 按文档可完成安装、配置和 Cursor 集成
