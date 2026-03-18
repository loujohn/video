import { getRouterParam } from 'h3'
import { SceneService } from '~/core/services/scene.service'
export default defineApiHandler(async (event) => {
  const projectId = getRouterParam(event, 'id')!
  const sceneId = getRouterParam(event, 'sid')!
  await SceneService.delete(projectId, sceneId, event.context.userId)
  return ok(null)
})
