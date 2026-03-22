import { StoryboardService } from '~/core/services/storyboard.service'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const propId = getRouterParam(event, 'pid')!
  return ok(await StoryboardService.findByProp(projectId, propId, userId))
})
