import { SceneVariantService } from '~/core/services/scene-variant.service'
import { createSceneVariantSchema } from '~~/server/schemas/scene-variant'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const sceneId = getRouterParam(event, 'sid')!
  const body = await validateBody(event, createSceneVariantSchema)
  return ok(await SceneVariantService.create(projectId, sceneId, body, userId))
})
