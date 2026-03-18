import { api } from '../lib/api-client.js'

export const projectTools = [
  {
    name: 'list_projects',
    description: '列出当前用户的所有项目',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'create_project',
    description: '创建新的短剧项目',
    inputSchema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: '项目标题' },
        team_id: { type: 'string', description: '团队 ID' },
        genre: { type: 'array', items: { type: 'string' }, description: '题材标签数组' },
        audience: { type: 'string', description: '目标受众' },
        tone: { type: 'string', description: '调性' },
        total_episodes: { type: 'number', description: '总集数' },
        mode: { type: 'string', description: '模式: domestic | overseas' },
        language: { type: 'string', description: '语言代码: zh-CN | en-US' },
      },
      required: ['title', 'team_id'],
    },
  },
  {
    name: 'get_project',
    description: '获取项目详情',
    inputSchema: {
      type: 'object' as const,
      properties: { project_id: { type: 'string', description: '项目 ID' } },
      required: ['project_id'],
    },
  },
  {
    name: 'update_project',
    description: '更新项目信息',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        title: { type: 'string' },
        genre: { type: 'array', items: { type: 'string' } },
        audience: { type: 'string' },
        tone: { type: 'string' },
        ending_type: { type: 'string' },
        total_episodes: { type: 'number' },
        status: { type: 'string' },
        mode: { type: 'string' },
        language: { type: 'string' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'save_creative_plan',
    description: '保存项目创作方案（包含核心概念、故事线、主题、受众、爽点设计等）',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        content: { type: 'object', description: '创作方案 JSON 内容' },
        change_summary: { type: 'string', description: '变更摘要' },
      },
      required: ['project_id', 'content'],
    },
  },
]

export async function handleProjectTool(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case 'list_projects':
      return JSON.stringify(await api.get('/api/projects'), null, 2)
    case 'create_project': {
      const { team_id, ...rest } = args
      return JSON.stringify(await api.post('/api/projects', { ...rest, team_id }), null, 2)
    }
    case 'get_project':
      return JSON.stringify(await api.get(`/api/projects/${args.project_id}`), null, 2)
    case 'update_project': {
      const { project_id, ...data } = args
      return JSON.stringify(await api.put(`/api/projects/${project_id}`, data), null, 2)
    }
    case 'save_creative_plan':
      return JSON.stringify(
        await api.put(`/api/projects/${args.project_id}/plan`, {
          content: args.content,
          change_summary: args.change_summary,
        }),
        null,
        2,
      )
    default:
      throw new Error(`Unknown project tool: ${name}`)
  }
}
