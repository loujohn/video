import { EpisodeService } from '~/core/services/episode.service'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  return ok(await EpisodeService.list(projectId, userId))
})
