import { api } from '../lib/api-client.js'

export const notificationTools = [
  {
    name: 'list_notifications',
    description: '列出当前用户的通知',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'mark_notification_read',
    description: '将指定通知标记为已读',
    inputSchema: {
      type: 'object' as const,
      properties: { notification_id: { type: 'string', description: '通知 ID' } },
      required: ['notification_id'],
    },
  },
  {
    name: 'mark_all_notifications_read',
    description: '将所有通知标记为已读',
    inputSchema: { type: 'object' as const, properties: {} },
  },
]

export async function handleNotificationTool(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case 'list_notifications':
      return JSON.stringify(await api.get('/api/notifications'), null, 2)
    case 'mark_notification_read':
      return JSON.stringify(await api.put(`/api/notifications/${args.notification_id}/read`), null, 2)
    case 'mark_all_notifications_read':
      return JSON.stringify(await api.put('/api/notifications/read-all'), null, 2)
    default:
      throw new Error(`Unknown notification tool: ${name}`)
  }
}
