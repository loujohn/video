import { CommentService } from '~/core/services/comment.service'
import { ProjectService } from '~/core/services/project.service'
import type { CommentEntityType } from '~/core/types'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const query = getQuery(event)
  const entityType = query.entity_type as CommentEntityType
  const entityIds = (Array.isArray(query.entity_ids) ? query.entity_ids : [query.entity_ids]).filter(Boolean) as string[]
  if (!entityType || !entityIds.length) badRequest('entity_type 和 entity_ids 必填')
  await ProjectService.getProject(projectId, userId)
  return ok(await CommentService.countByEntities(projectId, entityType, entityIds))
})
