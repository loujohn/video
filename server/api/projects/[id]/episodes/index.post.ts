import { EpisodeService } from '~/core/services/episode.service'
export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const body = await readBody(event)
  if (!body.episode_number) badRequest('episode_number 必填')
  return ok(await EpisodeService.create(projectId, body, userId))
})
