import { EpisodeService } from '~/core/services/episode.service'
import { createEpisodeSchema } from '~/schemas/episode'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const body = await validateBody(event, createEpisodeSchema)
  return ok(await EpisodeService.create(projectId, body, userId))
})
