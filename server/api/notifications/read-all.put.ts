import { NotificationService } from '~/core/services/notification.service'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const count = await NotificationService.markAllRead(userId)
  return ok({ marked: count })
})
