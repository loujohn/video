import { SceneVariantService } from '~/core/services/scene-variant.service'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const sceneId = getRouterParam(event, 'sid')!
  const variantId = getRouterParam(event, 'vid')!
  await SceneVariantService.delete(projectId, sceneId, variantId, userId)
  return ok({ deleted: true })
})
