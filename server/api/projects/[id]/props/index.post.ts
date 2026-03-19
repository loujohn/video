import { PropService } from '~/core/services/prop.service'
import { createPropSchema } from '~/schemas/prop'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const body = await validateBody(event, createPropSchema)
  return ok(await PropService.create(projectId, body, userId))
})
