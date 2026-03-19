import { StoryboardService } from '~/core/services/storyboard.service'
import { createStoryboardSchema } from '~/schemas/storyboard'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const num = Number(getRouterParam(event, 'num'))
  if (!Number.isInteger(num) || num < 1) badRequest('无效的集号')
  const body = await validateBody(event, createStoryboardSchema)
  return ok(await StoryboardService.create(projectId, num, body, userId))
})
