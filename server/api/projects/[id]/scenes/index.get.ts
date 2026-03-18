import { SceneService } from '~/core/services/scene.service'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  return ok(await SceneService.list(projectId, userId))
})
