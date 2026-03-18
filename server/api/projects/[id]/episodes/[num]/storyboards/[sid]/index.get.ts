import { StoryboardService } from '~/core/services/storyboard.service'
import { ok, badRequest } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const num = Number(getRouterParam(event, 'num'))
  if (!Number.isInteger(num) || num < 1) badRequest('无效的集号')
  const sid = getRouterParam(event, 'sid')!
  return ok(await StoryboardService.get(projectId, num, sid, userId))
})
