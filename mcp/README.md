# Video Drama MCP Server

## 简介

Video Drama MCP Server — 微短剧管理平台的 MCP 接口，使 AI 助手能够通过 MCP 协议与平台交互。

## 安装

```bash
cd mcp && npm install
```

## 环境变量配置

- `DRAMA_API_URL`: 平台 API 根地址（默认 `http://localhost:3002`）
- `DRAMA_API_TOKEN`: Bearer Token（在平台登录后获取）

## 运行

```bash
npm run start   # 生产模式
npm run dev     # 开发模式（自动重启）
```

## Cursor 配置示例

```json
{
  "mcpServers": {
    "video-drama": {
      "command": "npx",
      "args": ["tsx", "/path/to/video/mcp/server.ts"],
      "env": {
        "DRAMA_API_URL": "http://localhost:3002",
        "DRAMA_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

## 工具列表

共 21 个工具：

| Tool | Description |
|------|-------------|
| list_projects | 列出所有项目 |
| create_project | 创建新项目 |
| get_project | 获取项目详情 |
| update_project | 更新项目信息 |
| save_creative_plan | 保存创作方案 |
| list_characters | 列出角色 |
| create_character | 创建角色 |
| update_character | 更新角色 |
| set_character_relations | 设置角色关系 |
| list_scenes | 列出场景 |
| create_scene | 创建场景 |
| list_props | 列出道具 |
| create_prop | 创建道具 |
| list_episodes | 列出分集 |
| create_episode | 创建分集 |
| save_episode_script | 保存剧本 |
| get_episode_script | 获取剧本 |
| list_storyboards | 列出分镜 |
| create_storyboard | 创建分镜 |
| list_assets | 列出资源 |
| get_version_history | 查看版本历史 |

## 搭配 Skill 使用

参见 `skills/SKILL.md`。
