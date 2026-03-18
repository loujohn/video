import { getRouterParam } from 'h3'
import { SceneService } from '~/core/services/scene.service'
import { defineApiHandler } from '~/server/utils/handler'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const projectId = getRouterParam(event, 'id')!
  const sceneId = getRouterParam(event, 'sid')!
  await SceneService.delete(projectId, sceneId, event.context.userId)
  return ok(null)
})
