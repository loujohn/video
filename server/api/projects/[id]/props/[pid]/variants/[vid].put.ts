import { PropVariantService } from '~/core/services/prop-variant.service'
import { updatePropVariantSchema } from '~~/server/schemas/prop-variant'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const propId = getRouterParam(event, 'pid')!
  const variantId = getRouterParam(event, 'vid')!
  const body = await validateBody(event, updatePropVariantSchema)
  return ok(await PropVariantService.update(projectId, propId, variantId, body, userId))
})
