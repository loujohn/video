import { EpisodeService } from '~/core/services/episode.service'
import { ok, badRequest } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const num = Number(getRouterParam(event, 'num'))
  const body = await readBody(event)
  if (!body.content) badRequest('content 必填')
  return ok(await EpisodeService.saveScript(projectId, num, body.content, userId, body.change_summary))
})
