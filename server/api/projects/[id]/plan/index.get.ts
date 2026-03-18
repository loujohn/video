import { CreativePlanService } from '~/core/services/creative-plan.service'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  return ok(await CreativePlanService.get(projectId, userId))
})
