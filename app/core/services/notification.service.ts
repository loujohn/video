import { NotificationModel } from '../models/notification.model'
import type { NotificationWithActor, CreateNotificationInput } from '../types'

export const NotificationService = {
  async list(
    userId: string,
    options: { isRead?: boolean; limit?: number; offset?: number } = {},
  ): Promise<{ notifications: NotificationWithActor[]; unread_count: number; total: number }> {
    const [notifications, unread_count, total] = await Promise.all([
      NotificationModel.findByUser(userId, options),
      NotificationModel.countUnread(userId),
      NotificationModel.countTotal(userId, { isRead: options.isRead }),
    ])
    return { notifications, unread_count, total }
  },

  async markRead(notificationId: string, userId: string): Promise<boolean> {
    return NotificationModel.markRead(notificationId, userId)
  },

  async markAllRead(userId: string): Promise<number> {
    return NotificationModel.markAllRead(userId)
  },

  async notify(inputs: CreateNotificationInput[]): Promise<void> {
    if (!inputs.length) return
    await NotificationModel.createBatch(inputs)
  },
}
