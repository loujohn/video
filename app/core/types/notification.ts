export type NotificationType = 'comment' | 'mention' | 'reply' | 'status_change'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  content: string | null
  link: string | null
  is_read: boolean
  related_entity_type: string | null
  related_entity_id: string | null
  created_by: string | null
  created_at: Date
}

export interface NotificationWithActor extends Notification {
  actor_name?: string
}

export interface CreateNotificationInput {
  user_id: string
  type: NotificationType
  title: string
  content?: string
  link?: string
  related_entity_type?: string
  related_entity_id?: string
  created_by?: string
}
