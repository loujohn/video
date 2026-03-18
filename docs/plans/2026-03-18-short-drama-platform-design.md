# 短剧生成管理平台 — 设计文档

> 日期: 2026-03-18
> 状态: 已批准

---

## 1. 项目概述

构建一个短剧生成的全流程管理平台，覆盖从剧本创作到视觉生产再到视频制作的完整链路。平台同时服务人类用户（通过 Web UI）和 AI 助手（通过 MCP Server + Skill 文件），共享同一套 REST API 和业务逻辑。

### 核心决策

| 维度 | 决定 |
|------|------|
| 范围 | 全流程（剧本→视觉→视频） |
| 优先级 | 先做资源管理，AI 能力后续追加 |
| 架构 | API-First 单体，Web + Skill/MCP 并重 |
| 技术栈 | Nuxt.js + Knex + PostgreSQL |
| 用户模型 | 小团队协作 |
| 资源类型 | 项目/剧本/角色/场景/道具/分镜/音频/视频 |
| AI 接口 | MCP Server + Skill 文件（均通过 HTTP API 交互） |

### 参考项目

- [0xsline/short-drama](https://github.com/0xsline/short-drama) — 纯 Markdown 的短剧剧本创作 Skill，定义了完整的编剧工作流和方法论
- [saturndec/waoowaoo](https://github.com/saturndec/waoowaoo) — AI 影视 Studio，Next.js 全栈应用，覆盖剧本分析→图片生成→视频合成

---

## 2. 架构设计

### 整体架构

```
                 ┌───────────┐
                 │  Web UI   │
                 │  (Vue)    │
                 └────┬──────┘
                      │
┌───────────┐   ┌─────┴──────┐   ┌───────────┐
│ MCP Server│──→│ REST API   │←──│ AI Skill  │
│ (stdio)   │   │ (Nitro)    │   │(curl/fetch)│
└───────────┘   └─────┬──────┘   └───────────┘
                      │
                ┌─────┴──────┐
                │Core Service│
                │  + Models  │
                └─────┬──────┘
                      │
                ┌─────┴──────┐
                │ PostgreSQL │
                └────────────┘
```

### 分层职责

| 层 | 职责 | 技术 |
|---|------|------|
| Web UI | 用户界面、交互 | Vue 3 + Nuxt SSR |
| REST API | HTTP 接口、参数验证、权限检查 | Nuxt Nitro Server Routes |
| MCP Server | AI 助手的 MCP 工具入口，内部调用 REST API | @modelcontextprotocol/sdk |
| Skill 文件 | AI 助手的创作方法论 + API 文档 | 纯 Markdown |
| Core Service | 业务逻辑（纯 TS 模块，不依赖框架） | TypeScript |
| Models | 数据访问层 | Knex.js |
| Database | 数据持久化 | PostgreSQL |

关键设计点：
- `core/` 完全与框架无关的纯 TypeScript 模块
- `server/api/` 是薄包装层，只做参数解析和调用 core service
- MCP Server 作为独立进程，通过 HTTP 调用 REST API
- Skill 文件纯 Markdown，指导 AI 通过 curl/fetch 调用 REST API
- API 是唯一的数据入口，安全可控

---

## 3. 数据模型

### 实体关系

```
User (1) ----< TeamMember >---- (N) Team
Team (1) ----< (N) Project
Project (1) ----< (N) Episode
Project (1) ----< (N) Character
Project (1) ----< (N) Scene
Project (1) ----< (N) Prop
Project (1) ---- (1) CreativePlan
Episode (1) ----< (N) EpisodeScript     (版本化)
Episode (1) ----< (N) Storyboard
Asset ----> (多态关联) Character/Scene/Prop/Storyboard/Episode/Project
EntityVersion ----> (多态关联) 任意实体的版本快照
```

### 表结构

#### users — 用户

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| email | varchar unique | |
| name | varchar | |
| avatar | varchar | 头像 URL |
| password_hash | varchar | |
| created_at | timestamp | |

#### teams — 团队

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| name | varchar | |
| description | text | |
| created_by | uuid FK→users | |
| created_at | timestamp | |

#### team_members — 团队成员

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| team_id | uuid FK→teams | |
| user_id | uuid FK→users | |
| role | enum(owner/editor/viewer) | |
| joined_at | timestamp | |

#### projects — 短剧项目

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| team_id | uuid FK→teams | |
| title | varchar | 剧名 |
| genre | jsonb | 题材组合，如 ["霸道总裁","甜宠"] |
| audience | varchar | 男频/女频/全年龄 |
| tone | varchar | 甜/虐/甜虐/爽/燃/搞笑 |
| ending_type | varchar | HE/BE/OE |
| total_episodes | integer | 总集数 |
| language | varchar | zh-CN / en-US |
| mode | varchar | domestic / overseas |
| status | enum(draft/in_progress/review/completed) | |
| created_by | uuid FK→users | |
| created_at | timestamp | |
| updated_at | timestamp | |

#### creative_plans — 创作方案

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| project_id | uuid FK→projects unique | |
| content | jsonb | 完整创作方案结构化数据 |
| version | integer | 当前版本号 |
| created_at | timestamp | |
| updated_at | timestamp | |

content JSONB 结构：
```json
{
  "title_candidates": ["剧名A", "剧名B", "剧名C"],
  "background": { "era": "", "location": "", "social_env": "" },
  "storyline": "",
  "core_conflict": "",
  "three_act_structure": {
    "act1": { "episode_range": [1, 15], "events": [] },
    "act2": { "episode_range": [16, 45], "events": [] },
    "act3": { "episode_range": [46, 60], "events": [] }
  },
  "rhythm_curve": {},
  "paywall_points": [],
  "satisfaction_matrix": {},
  "ending_design": {}
}
```

#### characters — 角色

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| project_id | uuid FK→projects | |
| name | varchar | |
| age | integer | |
| appearance | text | 外貌描述 |
| personality_tags | jsonb | 如 ["倔强","善良","聪明"] |
| public_identity | varchar | 公开身份 |
| real_identity | varchar | 真实身份 |
| motivation | text | 核心动机 |
| conflict_point | text | 最大冲突点 |
| catchphrase | varchar | 口头禅 |
| arc_description | text | 角色弧线 |
| villain_level | integer nullable | null=非反派, 1-4=反派层级 |
| sort_order | integer | 排序 |
| is_active | boolean default true | 是否启用 |
| created_at | timestamp | |
| updated_at | timestamp | |

#### character_relations — 角色关系

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| project_id | uuid FK→projects | |
| from_character_id | uuid FK→characters | |
| to_character_id | uuid FK→characters | |
| relation_type | varchar | 如 "暗恋"/"陷害"/"师徒" |
| description | text | |

#### scenes — 场景库

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| project_id | uuid FK→projects | |
| name | varchar | 如 "念念甜品屋" |
| location_type | varchar | int/ext |
| time_of_day | varchar | day/night/dawn/dusk |
| description | text | |
| tags | jsonb | |
| is_active | boolean default true | |
| created_at | timestamp | |
| updated_at | timestamp | |

#### props — 道具库

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| project_id | uuid FK→projects | |
| name | varchar | 如 "家族戒指" |
| description | text | |
| tags | jsonb | |
| is_active | boolean default true | |
| created_at | timestamp | |
| updated_at | timestamp | |

#### episodes — 分集

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| project_id | uuid FK→projects | |
| episode_number | integer | 集号 |
| title | varchar | 集标题 |
| synopsis | text | 一句话概要 |
| hook_type | varchar | 悬念钩/反转钩/情绪钩/信息钩/危机钩 |
| is_key_episode | boolean default false | 🔥 重点集 |
| is_paywall | boolean default false | 💰 付费卡点 |
| act | integer | 所属幕 (1/2/3) |
| rhythm_phase | varchar | 起势/攀升/风暴/决战 |
| status | enum(planned/writing/written) | |
| is_active | boolean default true | |
| created_at | timestamp | |
| updated_at | timestamp | |

UNIQUE(project_id, episode_number)

#### episode_scripts — 分集剧本内容

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| episode_id | uuid FK→episodes | |
| content | text | 完整剧本 Markdown |
| version | integer | 版本号 |
| word_count | integer | 字数统计 |
| created_by | uuid FK→users | |
| created_at | timestamp | |

#### storyboards — 分镜

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| episode_id | uuid FK→episodes | |
| sequence_number | integer | 序号 |
| shot_type | varchar | 全景/中景/近景/特写 |
| scene_id | uuid FK→scenes nullable | 关联场景 |
| description | text | 画面描述 |
| dialogue | text | 台词 |
| action_direction | text | 动作指示 |
| music_cue | text | 音乐提示 |
| duration_seconds | decimal | 时长(秒) |
| is_active | boolean default true | |
| created_at | timestamp | |
| updated_at | timestamp | |

#### assets — 资源文件

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| project_id | uuid FK→projects | |
| type | varchar | image/audio/video |
| category | varchar | 见下表 |
| file_path | varchar | 存储路径 |
| file_name | varchar | 原始文件名 |
| file_size | bigint | 字节数 |
| mime_type | varchar | |
| metadata | jsonb | 宽高/时长等 |
| linked_entity_type | varchar | character/scene/prop/storyboard/episode/project |
| linked_entity_id | uuid | 关联实体 ID |
| is_active | boolean default true | |
| created_at | timestamp | |

category 枚举：

| type | category | 说明 |
|------|----------|------|
| image | character_portrait | 角色立绘 |
| image | character_expression | 角色表情 |
| image | character_costume | 角色服装 |
| image | scene_bg | 场景背景 |
| image | scene_concept | 场景概念图 |
| image | prop_image | 道具图片 |
| image | storyboard_frame | 分镜帧 |
| image | poster | 海报 |
| audio | voiceover | 配音 |
| audio | bgm | 背景音乐 |
| audio | sfx | 音效 |
| video | final_video | 最终视频 |
| video | clip | 视频片段 |

#### entity_versions — 版本历史

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| entity_type | varchar | character/scene/prop/creative_plan/storyboard |
| entity_id | uuid | |
| version_number | integer | |
| snapshot | jsonb | 该版本的完整数据快照 |
| change_summary | text | 变更说明 |
| created_by | uuid FK→users | |
| created_at | timestamp | |

---

## 4. 项目结构

```
video/
├── nuxt.config.ts
├── package.json
├── knexfile.ts
├── .env
│
├── core/                       # ⭐ 核心业务层（与框架无关）
│   ├── services/
│   │   ├── project.service.ts
│   │   ├── episode.service.ts
│   │   ├── character.service.ts
│   │   ├── scene.service.ts
│   │   ├── prop.service.ts
│   │   ├── storyboard.service.ts
│   │   ├── asset.service.ts
│   │   └── version.service.ts
│   ├── models/
│   │   ├── project.model.ts
│   │   ├── episode.model.ts
│   │   └── ...
│   ├── types/
│   │   ├── project.ts
│   │   ├── episode.ts
│   │   └── ...
│   └── db.ts
│
├── server/                     # Nuxt server 层
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.post.ts
│   │   │   ├── register.post.ts
│   │   │   └── me.get.ts
│   │   ├── projects/
│   │   │   ├── index.get.ts
│   │   │   ├── index.post.ts
│   │   │   └── [id]/
│   │   │       ├── index.get.ts
│   │   │       ├── index.put.ts
│   │   │       ├── plan.get.ts
│   │   │       ├── plan.put.ts
│   │   │       ├── characters/
│   │   │       ├── scenes/
│   │   │       ├── props/
│   │   │       ├── episodes/
│   │   │       │   └── [num]/
│   │   │       │       └── scripts/
│   │   │       ├── storyboards/
│   │   │       └── assets/
│   │   └── teams/
│   ├── middleware/
│   └── utils/
│
├── pages/                      # 前端页面
│   ├── index.vue               # 仪表盘
│   ├── login.vue
│   ├── projects/
│   │   ├── index.vue           # 项目列表
│   │   └── [id]/
│   │       ├── index.vue       # 项目概览
│   │       ├── plan.vue        # 创作方案
│   │       ├── characters.vue  # 角色管理
│   │       ├── scenes.vue      # 场景与道具
│   │       ├── episodes/       # 分集管理
│   │       ├── storyboards.vue # 分镜板
│   │       └── assets.vue      # 资源库
│   └── teams/
│
├── components/
│   ├── layout/
│   ├── project/
│   ├── episode/
│   ├── character/
│   └── common/
│
├── composables/
│
├── mcp/                        # MCP Server（独立进程）
│   ├── server.ts
│   ├── tools/
│   │   ├── project-tools.ts
│   │   ├── episode-tools.ts
│   │   ├── character-tools.ts
│   │   └── ...
│   └── README.md
│
├── skills/                     # AI Skill 文件
│   ├── SKILL.md
│   └── references/
│       ├── genre-guide.md
│       ├── opening-rules.md
│       ├── rhythm-curve.md
│       ├── hook-design.md
│       ├── paywall-design.md
│       ├── satisfaction-matrix.md
│       ├── villain-design.md
│       ├── storyboard-guide.md
│       └── visual-style-guide.md
│
├── migrations/
│   └── 001_initial.ts
│
├── seeds/
│
└── uploads/                    # 本地文件存储（开发用）
```

---

## 5. Web UI 设计

### 整体布局

- 左侧边栏导航（可收缩）
- 顶部 Header（团队切换 + 用户菜单）
- 主内容区

### 页面规划

#### 仪表盘 `/`
- 项目快速统计（进行中/已完成）
- 最近编辑的项目
- 团队活动时间线

#### 项目列表 `/projects`
- 卡片网格展示（项目封面 + 题材标签 + 进度条）
- 筛选：题材、状态、受众
- 新建项目向导（选题材→设受众→定集数）

#### 项目详情 — 侧边栏二级导航

**概览** `/projects/:id`
- 项目元信息卡片
- 创作流程进度条（选题→方案→角色→目录→剧本→分镜→视频）
- 快速统计（已写集数、角色数、资源数）

**创作方案** `/projects/:id/plan`
- 富文本编辑器（Markdown）
- 分板块展示：三幕结构、节奏曲线、付费卡点、爽感矩阵
- 版本历史侧边栏

**角色管理** `/projects/:id/characters`
- 角色卡片列表（头像 + 名字 + 身份 + 标签）
- 角色详情抽屉/弹窗（全部档案字段）
- 角色关系图（可视化网络图）
- 角色图片库（关联的所有图片 assets）
- 启用/禁用切换

**场景与道具** `/projects/:id/scenes`
- 场景卡片列表（场景图 + 名称 + 内/外景 + 日/夜）
- 道具列表（Tab 切换）
- 关联图片库

**分集目录** `/projects/:id/episodes`
- 表格视图（集号 + 标题 + 钩子 + 标记 + 状态）
- 可拖拽排序
- 节奏段落分组显示（起势/攀升/风暴/决战）
- 🔥/💰 标记快速切换

**剧本编辑** `/projects/:id/episodes/:num`
- 左侧：剧本编辑器（Markdown，支持场次分块）
- 右侧：元信息面板（钩子类型、引用角色、引用场景）
- 底部：版本历史切换

**分镜板** `/projects/:id/storyboards`
- 按集筛选
- 缩略图网格（序号 + 镜头类型 + 图片 + 时长）
- 拖拽排序
- 点击进入分镜详情编辑

**资源库** `/projects/:id/assets`
- 分类浏览（图片/音频/视频）
- 批量上传
- 筛选：关联实体、类型
- 预览（图片展示、音频播放、视频播放）

#### 团队管理 `/teams`
- 成员列表 + 角色管理
- 邀请成员

---

## 6. MCP Server 设计

MCP Server 作为独立进程，通过 HTTP 调用平台 REST API。

### 暴露的 MCP 工具

| 工具名 | 功能 | HTTP 映射 |
|------|------|------|
| list_projects | 列出所有项目 | GET /api/projects |
| create_project | 创建新项目 | POST /api/projects |
| get_project | 获取项目详情 | GET /api/projects/:id |
| update_project | 更新项目 | PUT /api/projects/:id |
| save_creative_plan | 保存创作方案 | PUT /api/projects/:id/plan |
| list_characters | 列出角色 | GET /api/projects/:id/characters |
| create_character | 创建角色 | POST /api/projects/:id/characters |
| update_character | 更新角色 | PUT /api/projects/:id/characters/:cid |
| set_character_relations | 设置角色关系 | PUT /api/projects/:id/character-relations |
| list_scenes | 列出场景 | GET /api/projects/:id/scenes |
| create_scene | 创建场景 | POST /api/projects/:id/scenes |
| list_props | 列出道具 | GET /api/projects/:id/props |
| create_prop | 创建道具 | POST /api/projects/:id/props |
| list_episodes | 列出分集 | GET /api/projects/:id/episodes |
| create_episode | 创建分集 | POST /api/projects/:id/episodes |
| save_episode_script | 保存剧本 | POST /api/projects/:id/episodes/:num/scripts |
| get_episode_script | 获取剧本 | GET /api/projects/:id/episodes/:num/scripts |
| list_storyboards | 列出分镜 | GET /api/projects/:id/storyboards |
| create_storyboard | 创建分镜 | POST /api/projects/:id/storyboards |
| upload_asset | 上传资源 | POST /api/projects/:id/assets |
| list_assets | 列出资源 | GET /api/projects/:id/assets |
| get_version_history | 查看版本历史 | GET /api/versions/:type/:id |

---

## 7. Skill 文件设计

### SKILL.md 核心内容

1. 角色定义："你是一位专业的微短剧编剧..."
2. 平台 API 配置：`{DRAMA_API_URL}` 环境变量
3. 命令定义：`/开始`, `/创作方案`, `/角色开发`, `/目录`, `/分集 N`, `/出海`
4. 每个命令的输入输出规范
5. 与平台的交互方式：
   - 优先用 MCP Server（如可用）
   - 否则通过 curl/fetch 调用 REST API
6. 参考知识库加载规则

### references/ 目录

从 short-drama 借鉴并增强：
- genre-guide.md — 13种题材 + 出海题材映射
- opening-rules.md — 开篇黄金法则
- rhythm-curve.md — 节奏曲线设计
- hook-design.md — 5种钩子类型
- paywall-design.md — 付费卡点策略
- satisfaction-matrix.md — 爽感矩阵
- villain-design.md — 四层反派体系
- storyboard-guide.md — 分镜设计指南（新增）
- visual-style-guide.md — 视觉风格指南（新增）

---

## 8. 分阶段实施路线图

### Phase 1：基座搭建（第 1 周）
- Nuxt.js 项目初始化 + Knex + PostgreSQL
- 数据库迁移（全部表结构）
- Core Service Layer 骨架（所有 service + model）
- 基础认证（注册/登录 JWT）
- 团队 CRUD
- 基础布局组件（侧边栏 + Header）

### Phase 2：核心资源管理（第 2-3 周）
- 项目 CRUD + 列表/详情页
- 创作方案编辑与版本管理
- 角色管理（CRUD + 关系图 + 图片关联）
- 场景与道具管理
- 分集目录管理
- 剧本编辑器（Markdown + 版本管理）
- 版本历史系统

### Phase 3：视觉与资源（第 4 周）
- 分镜管理（CRUD + 拖拽排序）
- 资源库（上传/浏览/关联）
- 文件存储服务（本地 + 可配置 S3/MinIO）
- 图片/音频/视频预览

### Phase 4：AI 接口层（第 5 周）
- MCP Server 实现
- Skill 文件编写
- References 知识库整理
- API 文档生成

### Future Phase 5（AI 能力，暂不实施）
- AI 剧本生成
- AI 图片生成
- AI 配音
- AI 视频合成

---

## 9. 技术依赖

| 类别 | 依赖 |
|------|------|
| 框架 | nuxt@3, vue@3, typescript |
| 数据库 | knex, pg |
| 认证 | 自建 JWT (jose) |
| UI | primevue (Aura theme) + tailwindcss |
| 编辑器 | tiptap 或 milkdown (富文本/Markdown) |
| 图表 | d3.js 或 vis-network (角色关系图) |
| 拖拽 | vuedraggable |
| 文件上传 | formidable |
| MCP | @modelcontextprotocol/sdk |
| 设计参考 | ui-ux-pro-max-skill |
