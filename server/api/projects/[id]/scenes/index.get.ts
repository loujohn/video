import { SceneService } from '~/core/services/scene.service'
export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  return ok(await SceneService.list(projectId, userId))
})
