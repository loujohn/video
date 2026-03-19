import { SceneService } from '~/core/services/scene.service'
import { createSceneSchema } from '~/schemas/scene'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const body = await validateBody(event, createSceneSchema)
  return ok(await SceneService.create(projectId, body, userId))
})
