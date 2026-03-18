import { defineApiHandler } from '~/server/utils/api'
import { AssetModel } from '~/core/models/asset.model'
import { ProjectService } from '~/core/services/project.service'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const query = getQuery(event)

  await ProjectService.getProject(projectId, userId)

  const entityType = query.entity_type as string
  const entityIdsRaw = query.entity_ids as string
  const includeInactive = query.include_inactive === 'true'

  if (!entityType || !entityIdsRaw) {
    throw createError({ statusCode: 400, statusMessage: 'entity_type and entity_ids required' })
  }

  const entityIds = entityIdsRaw.split(',').filter(Boolean)
  if (entityIds.length === 0 || entityIds.length > 100) {
    throw createError({ statusCode: 400, statusMessage: 'entity_ids must contain 1-100 IDs' })
  }

  const assets = await AssetModel.findByEntities(projectId, entityType, entityIds, !includeInactive)

  const grouped: Record<string, typeof assets> = {}
  for (const id of entityIds) {
    grouped[id] = []
  }
  for (const asset of assets) {
    if (asset.linked_entity_id && grouped[asset.linked_entity_id]) {
      grouped[asset.linked_entity_id].push(asset)
    }
  }

  return ok(grouped)
})
