import { AssetService } from '~/core/services/asset.service'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const query = getQuery(event)
  const filters = {
    type: query.type as string | undefined,
    category: query.category as string | undefined,
    linked_entity_type: query.linked_entity_type as string | undefined,
    linked_entity_id: query.linked_entity_id as string | undefined,
  }
  return ok(await AssetService.list(projectId, userId, filters))
})
