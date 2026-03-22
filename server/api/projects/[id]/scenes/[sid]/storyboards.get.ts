import { StoryboardService } from '~/core/services/storyboard.service'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const sceneId = getRouterParam(event, 'sid')!
  return ok(await StoryboardService.findByScene(projectId, sceneId, userId))
})
