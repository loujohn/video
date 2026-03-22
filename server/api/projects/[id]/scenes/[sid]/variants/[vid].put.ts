import { SceneVariantService } from '~/core/services/scene-variant.service'
import { updateSceneVariantSchema } from '~~/server/schemas/scene-variant'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const sceneId = getRouterParam(event, 'sid')!
  const variantId = getRouterParam(event, 'vid')!
  const body = await validateBody(event, updateSceneVariantSchema)
  return ok(await SceneVariantService.update(projectId, sceneId, variantId, body, userId))
})
