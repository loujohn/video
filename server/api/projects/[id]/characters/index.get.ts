import { CharacterService } from '~/core/services/character.service'
export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const characters = await CharacterService.list(projectId, userId)
  return ok(characters)
})
