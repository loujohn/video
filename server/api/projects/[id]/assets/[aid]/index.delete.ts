import { AssetService } from '~/core/services/asset.service'
export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const aid = getRouterParam(event, 'aid')!
  await AssetService.delete(projectId, aid, userId)
  return ok({ deleted: true })
})
