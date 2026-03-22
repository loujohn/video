import { SceneVariantService } from '~/core/services/scene-variant.service'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const sceneId = getRouterParam(event, 'sid')!
  return ok(await SceneVariantService.list(projectId, sceneId, userId))
})
