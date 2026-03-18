import { getRouterParam } from 'h3'
import { EpisodeService } from '~/core/services/episode.service'
export default defineApiHandler(async (event) => {
  const projectId = getRouterParam(event, 'id')!
  const episodeNum = parseInt(getRouterParam(event, 'num')!, 10)
  await EpisodeService.delete(projectId, episodeNum, event.context.userId)
  return ok(null)
})
