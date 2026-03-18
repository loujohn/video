import { CharacterService } from '~/core/services/character.service'
export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const characterId = getRouterParam(event, 'cid')!
  const character = await CharacterService.get(projectId, characterId, userId)
  return ok(character)
})
