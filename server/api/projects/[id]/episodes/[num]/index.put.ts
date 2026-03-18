import { EpisodeService } from '~/core/services/episode.service'
export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const num = Number(getRouterParam(event, 'num'))
  const body = await readBody(event)
  return ok(await EpisodeService.update(projectId, num, body, userId))
})
