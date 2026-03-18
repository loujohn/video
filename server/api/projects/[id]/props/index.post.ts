import { PropService } from '~/core/services/prop.service'
export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const body = await readBody(event)
  if (!body.name) badRequest('name 必填')
  return ok(await PropService.create(projectId, body, userId))
})
