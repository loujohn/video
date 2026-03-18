import { AssetService } from '~/core/services/asset.service'
export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const query = getQuery(event)
  const entityType = query.entity_type as string
  const entityId = query.entity_id as string

  if (!entityType || !entityId) {
    throw createError({ statusCode: 400, statusMessage: 'entity_type and entity_id required' })
  }

  return ok(
    await AssetService.list(projectId, userId, {
      linked_entity_type: entityType,
      linked_entity_id: entityId,
    }),
  )
})
