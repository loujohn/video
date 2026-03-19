import { getDb } from '../db'
import type { Notification, NotificationWithActor, CreateNotificationInput } from '../types'

const TABLE = 'notifications'

export const NotificationModel = {
  async findByUser(
    userId: string,
    options: { isRead?: boolean; limit?: number; offset?: number } = {},
  ): Promise<NotificationWithActor[]> {
    const query = getDb()(TABLE)
      .leftJoin('users', `${TABLE}.created_by`, 'users.id')
      .where({ [`${TABLE}.user_id`]: userId })
      .select(`${TABLE}.*`, 'users.name as actor_name')
      .orderBy(`${TABLE}.created_at`, 'desc')

    if (options.isRead !== undefined) {
      query.where(`${TABLE}.is_read`, options.isRead)
    }
    if (options.limit) query.limit(options.limit)
    if (options.offset) query.offset(options.offset)

    return query
  },

  async countUnread(userId: string): Promise<number> {
    const result = await getDb()(TABLE)
      .where({ user_id: userId, is_read: false })
      .count('id as count')
      .first()
    return Number(result?.count || 0)
  },

  async countTotal(userId: string, options: { isRead?: boolean } = {}): Promise<number> {
    const query = getDb()(TABLE).where({ user_id: userId })
    if (options.isRead !== undefined) query.where('is_read', options.isRead)
    const result = await query.count('id as count').first()
    return Number(result?.count || 0)
  },

  async create(input: CreateNotificationInput): Promise<Notification> {
    const [row] = await getDb()(TABLE)
      .insert({
        user_id: input.user_id,
        type: input.type,
        title: input.title,
        content: input.content ?? null,
        link: input.link ?? null,
        related_entity_type: input.related_entity_type ?? null,
        related_entity_id: input.related_entity_id ?? null,
        created_by: input.created_by ?? null,
      })
      .returning('*')
    return row
  },

  async createBatch(inputs: CreateNotificationInput[]): Promise<Notification[]> {
    if (!inputs.length) return []
    const rows = inputs.map((input) => ({
      user_id: input.user_id,
      type: input.type,
      title: input.title,
      content: input.content ?? null,
      link: input.link ?? null,
      related_entity_type: input.related_entity_type ?? null,
      related_entity_id: input.related_entity_id ?? null,
      created_by: input.created_by ?? null,
    }))
    return getDb()(TABLE).insert(rows).returning('*')
  },

  async markRead(id: string, userId: string): Promise<boolean> {
    const count = await getDb()(TABLE)
      .where({ id, user_id: userId })
      .update({ is_read: true })
    return count > 0
  },

  async markAllRead(userId: string): Promise<number> {
    return getDb()(TABLE)
      .where({ user_id: userId, is_read: false })
      .update({ is_read: true })
  },
}
