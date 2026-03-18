import { AssetService } from '~/core/services/asset.service'
export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const aid = getRouterParam(event, 'aid')!
  const body = await readBody(event)
  return ok(await AssetService.update(projectId, aid, body, userId))
})
