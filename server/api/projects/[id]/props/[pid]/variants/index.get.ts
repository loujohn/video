import { PropVariantService } from '~/core/services/prop-variant.service'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const propId = getRouterParam(event, 'pid')!
  return ok(await PropVariantService.list(projectId, propId, userId))
})
