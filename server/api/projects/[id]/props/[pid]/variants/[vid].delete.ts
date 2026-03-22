import { PropVariantService } from '~/core/services/prop-variant.service'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const propId = getRouterParam(event, 'pid')!
  const variantId = getRouterParam(event, 'vid')!
  await PropVariantService.delete(projectId, propId, variantId, userId)
  return ok({ deleted: true })
})
