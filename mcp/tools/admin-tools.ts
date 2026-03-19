import { api } from '../lib/api-client.js'

export const adminTools = [
  {
    name: 'admin_list_users',
    description: '（管理员）列出系统所有用户，支持搜索和筛选',
    inputSchema: {
      type: 'object' as const,
      properties: {
        q: { type: 'string', description: '搜索关键词（名称或邮箱）' },
        role: { type: 'string', enum: ['admin', 'user'], description: '按角色筛选' },
        is_active: { type: 'string', enum: ['true', 'false'], description: '按状态筛选' },
        page: { type: 'number', description: '页码（默认 1）' },
        per_page: { type: 'number', description: '每页数量（默认 20，最大 100）' },
      },
    },
  },
  {
    name: 'admin_get_user',
    description: '（管理员）获取指定用户的详情',
    inputSchema: {
      type: 'object' as const,
      properties: { user_id: { type: 'string', description: '用户 ID' } },
      required: ['user_id'],
    },
  },
  {
    name: 'admin_update_user',
    description: '（管理员）修改用户信息（名称、角色、启用/禁用）',
    inputSchema: {
      type: 'object' as const,
      properties: {
        user_id: { type: 'string', description: '用户 ID' },
        name: { type: 'string', description: '新名称' },
        role: { type: 'string', enum: ['admin', 'user'], description: '新角色' },
        is_active: { type: 'boolean', description: '启用/禁用' },
      },
      required: ['user_id'],
    },
  },
  {
    name: 'admin_delete_user',
    description: '（管理员）删除用户',
    inputSchema: {
      type: 'object' as const,
      properties: { user_id: { type: 'string', description: '用户 ID' } },
      required: ['user_id'],
    },
  },
  {
    name: 'admin_reset_password',
    description: '（管理员）重置用户密码，返回临时密码',
    inputSchema: {
      type: 'object' as const,
      properties: { user_id: { type: 'string', description: '用户 ID' } },
      required: ['user_id'],
    },
  },
]

export async function handleAdminTool(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case 'admin_list_users': {
      const params = new URLSearchParams()
      if (args.q) params.set('q', args.q as string)
      if (args.role) params.set('role', args.role as string)
      if (args.is_active) params.set('is_active', args.is_active as string)
      if (args.page) params.set('page', String(args.page))
      if (args.per_page) params.set('per_page', String(args.per_page))
      const qs = params.toString() ? `?${params.toString()}` : ''
      return JSON.stringify(await api.get(`/api/admin/users${qs}`), null, 2)
    }
    case 'admin_get_user':
      return JSON.stringify(await api.get(`/api/admin/users/${args.user_id}`), null, 2)
    case 'admin_update_user': {
      const { user_id, ...data } = args
      return JSON.stringify(await api.put(`/api/admin/users/${user_id}`, data), null, 2)
    }
    case 'admin_delete_user':
      return JSON.stringify(await api.del(`/api/admin/users/${args.user_id}`), null, 2)
    case 'admin_reset_password':
      return JSON.stringify(await api.put(`/api/admin/users/${args.user_id}/reset-password`), null, 2)
    default:
      throw new Error(`Unknown admin tool: ${name}`)
  }
}
