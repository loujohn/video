import { SceneService } from '~/core/services/scene.service'
export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const sceneId = getRouterParam(event, 'sid')!
  const body = await readBody(event)
  return ok(await SceneService.update(projectId, sceneId, body, userId))
})
