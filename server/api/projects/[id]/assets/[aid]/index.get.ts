import { AssetService } from '~/core/services/asset.service'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const aid = getRouterParam(event, 'aid')!
  return ok(await AssetService.get(projectId, aid, userId))
})
