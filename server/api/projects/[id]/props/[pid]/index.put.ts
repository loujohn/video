import { PropService } from '~/core/services/prop.service'
export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const propId = getRouterParam(event, 'pid')!
  const body = await readBody(event)
  return ok(await PropService.update(projectId, propId, body, userId))
})
