import { CreativePlanService } from '~/core/services/creative-plan.service'
export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const body = await readBody(event)
  if (!body.content) badRequest('content 必填')
  return ok(await CreativePlanService.update(projectId, body, userId))
})
