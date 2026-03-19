import { api } from '../lib/api-client.js'

export const teamTools = [
  {
    name: 'list_teams',
    description: '列出当前用户所属的所有团队',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'create_team',
    description: '创建新团队',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: '团队名称' },
        description: { type: 'string', description: '团队描述' },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_team',
    description: '获取团队详情',
    inputSchema: {
      type: 'object' as const,
      properties: { team_id: { type: 'string', description: '团队 ID' } },
      required: ['team_id'],
    },
  },
  {
    name: 'update_team',
    description: '更新团队信息',
    inputSchema: {
      type: 'object' as const,
      properties: {
        team_id: { type: 'string', description: '团队 ID' },
        name: { type: 'string', description: '团队名称' },
        description: { type: 'string', description: '团队描述' },
      },
      required: ['team_id'],
    },
  },
  {
    name: 'list_team_members',
    description: '列出团队成员',
    inputSchema: {
      type: 'object' as const,
      properties: { team_id: { type: 'string', description: '团队 ID' } },
      required: ['team_id'],
    },
  },
  {
    name: 'add_team_member',
    description: '添加团队成员',
    inputSchema: {
      type: 'object' as const,
      properties: {
        team_id: { type: 'string', description: '团队 ID' },
        email: { type: 'string', description: '成员邮箱' },
        role: { type: 'string', enum: ['editor', 'viewer'], description: '成员角色' },
      },
      required: ['team_id', 'email'],
    },
  },
]

export async function handleTeamTool(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case 'list_teams':
      return JSON.stringify(await api.get('/api/teams'), null, 2)
    case 'create_team':
      return JSON.stringify(await api.post('/api/teams', args), null, 2)
    case 'get_team':
      return JSON.stringify(await api.get(`/api/teams/${args.team_id}`), null, 2)
    case 'update_team': {
      const { team_id, ...data } = args
      return JSON.stringify(await api.put(`/api/teams/${team_id}`, data), null, 2)
    }
    case 'list_team_members':
      return JSON.stringify(await api.get(`/api/teams/${args.team_id}/members`), null, 2)
    case 'add_team_member': {
      const { team_id, ...data } = args
      return JSON.stringify(await api.post(`/api/teams/${team_id}/members`, data), null, 2)
    }
    default:
      throw new Error(`Unknown team tool: ${name}`)
  }
}
