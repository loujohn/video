import { CharacterService } from '~/core/services/character.service'
import { updateCharacterSchema } from '~/schemas/character'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const characterId = getRouterParam(event, 'cid')!
  const body = await validateBody(event, updateCharacterSchema)
  const character = await CharacterService.update(projectId, characterId, body, userId)
  return ok(character)
})
