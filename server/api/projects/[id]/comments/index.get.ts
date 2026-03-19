import { CommentService } from '~/core/services/comment.service'
import type { CommentEntityType } from '~/core/types'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const query = getQuery(event)
  const entityType = query.entity_type as CommentEntityType
  const entityId = query.entity_id as string
  if (!entityType || !entityId) badRequest('entity_type 和 entity_id 必填')
  return ok(await CommentService.list(projectId, entityType, entityId, userId))
})
