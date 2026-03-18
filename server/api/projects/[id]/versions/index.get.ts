import { VersionService } from '~/core/services/version.service'
import { ProjectService } from '~/core/services/project.service'
import { ok, badRequest } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  await ProjectService.getProject(projectId, userId)

  const query = getQuery(event)
  const entityType = query.entity_type as string
  const entityId = query.entity_id as string
  if (!entityType || !entityId) badRequest('entity_type 和 entity_id 必填')

  return ok(await VersionService.getHistory(entityType, entityId))
})
