import { NotificationService } from '~/core/services/notification.service'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const notificationId = getRouterParam(event, 'nid')!
  const success = await NotificationService.markRead(notificationId, userId)
  return ok({ success })
})
