import { StoryboardService } from '~/core/services/storyboard.service'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const characterId = getRouterParam(event, 'cid')!
  return ok(await StoryboardService.findByCharacter(projectId, characterId, userId))
})
