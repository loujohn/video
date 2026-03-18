import { getRouterParam } from 'h3'
import { PropService } from '~/core/services/prop.service'
export default defineApiHandler(async (event) => {
  const projectId = getRouterParam(event, 'id')!
  const propId = getRouterParam(event, 'pid')!
  await PropService.delete(projectId, propId, event.context.userId)
  return ok(null)
})
