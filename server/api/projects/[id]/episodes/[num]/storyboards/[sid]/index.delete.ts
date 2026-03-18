import { StoryboardService } from '~/core/services/storyboard.service'
export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const num = Number(getRouterParam(event, 'num'))
  if (!Number.isInteger(num) || num < 1) badRequest('无效的集号')
  const sid = getRouterParam(event, 'sid')!
  await StoryboardService.delete(projectId, num, sid, userId)
  return ok({ deleted: true })
})
