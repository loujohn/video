import { SceneService } from '~/core/services/scene.service'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const sceneId = getRouterParam(event, 'sid')!
  return ok(await SceneService.get(projectId, sceneId, userId))
})
