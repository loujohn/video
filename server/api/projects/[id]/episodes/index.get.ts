import { EpisodeService } from '~/core/services/episode.service'
export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  return ok(await EpisodeService.list(projectId, userId))
})
