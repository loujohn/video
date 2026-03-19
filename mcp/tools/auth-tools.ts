import { api } from '../lib/api-client.js'

export const authTools = [
  {
    name: 'login',
    description: '用户登录，返回 JWT token（注意：此 token 需手动配置为 DRAMA_API_TOKEN 环境变量才能用于其他 MCP 工具调用）',
    inputSchema: {
      type: 'object' as const,
      properties: {
        email: { type: 'string', description: '邮箱' },
        password: { type: 'string', description: '密码' },
      },
      required: ['email', 'password'],
    },
  },
  {
    name: 'register',
    description: '注册新用户',
    inputSchema: {
      type: 'object' as const,
      properties: {
        email: { type: 'string', description: '邮箱' },
        name: { type: 'string', description: '用户名' },
        password: { type: 'string', description: '密码' },
      },
      required: ['email', 'name', 'password'],
    },
  },
  {
    name: 'get_current_user',
    description: '获取当前登录用户信息',
    inputSchema: { type: 'object' as const, properties: {} },
  },
]

export async function handleAuthTool(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case 'login':
      return JSON.stringify(await api.post('/api/auth/login', { email: args.email, password: args.password }), null, 2)
    case 'register':
      return JSON.stringify(await api.post('/api/auth/register', { email: args.email, name: args.name, password: args.password }), null, 2)
    case 'get_current_user':
      return JSON.stringify(await api.get('/api/auth/me'), null, 2)
    default:
      throw new Error(`Unknown auth tool: ${name}`)
  }
}
