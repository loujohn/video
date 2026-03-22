import { PropVariantService } from '~/core/services/prop-variant.service'
import { createPropVariantSchema } from '~~/server/schemas/prop-variant'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const propId = getRouterParam(event, 'pid')!
  const body = await validateBody(event, createPropVariantSchema)
  return ok(await PropVariantService.create(projectId, propId, body, userId))
})
