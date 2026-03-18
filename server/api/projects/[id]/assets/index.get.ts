import { AssetService } from '~/core/services/asset.service'
export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const query = getQuery(event)
  const isActiveParam = query.is_active as string | undefined
  const filters = {
    type: query.type as string | undefined,
    category: query.category as string | undefined,
    linked_entity_type: query.linked_entity_type as string | undefined,
    linked_entity_id: query.linked_entity_id as string | undefined,
    is_active: isActiveParam === 'all' ? 'all' as const
      : isActiveParam === 'false' ? false
      : undefined,
  }
  return ok(await AssetService.list(projectId, userId, filters))
})
