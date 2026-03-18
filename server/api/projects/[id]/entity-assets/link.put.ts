import { AssetService } from '~/core/services/asset.service'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const { asset_id, entity_type, entity_id } = body

  if (!asset_id) {
    throw createError({ statusCode: 400, statusMessage: 'asset_id required' })
  }

  const asset = await AssetService.update(projectId, asset_id, {
    linked_entity_type: entity_type ?? null,
    linked_entity_id: entity_id ?? null,
  }, userId)
  return ok(asset)
})
