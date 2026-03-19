import { NotificationService } from '~/core/services/notification.service'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const query = getQuery(event)
  const options: { isRead?: boolean; limit?: number; offset?: number } = {}

  if (query.is_read === 'true') options.isRead = true
  else if (query.is_read === 'false') options.isRead = false
  if (query.limit !== undefined && query.limit !== '') options.limit = Math.min(Math.max(Number(query.limit), 0), 50)
  if (query.offset) options.offset = Number(query.offset)

  return ok(await NotificationService.list(userId, options))
})
