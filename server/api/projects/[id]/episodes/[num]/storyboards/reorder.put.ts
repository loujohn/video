import { StoryboardService } from '~/core/services/storyboard.service'
export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const num = Number(getRouterParam(event, 'num'))
  if (!Number.isInteger(num) || num < 1) badRequest('无效的集号')
  const body = await readBody(event)
  if (!Array.isArray(body?.ids)) badRequest('ids 必填且为数组')
  await StoryboardService.reorder(projectId, num, body.ids, userId)
  return ok({ reordered: true })
})
