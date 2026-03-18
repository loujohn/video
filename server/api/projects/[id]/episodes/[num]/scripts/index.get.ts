import { EpisodeService } from '~/core/services/episode.service'
export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const num = Number(getRouterParam(event, 'num'))
  const script = await EpisodeService.getLatestScript(projectId, num, userId)
  return ok(script)
})
