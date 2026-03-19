import { CharacterService } from '~/core/services/character.service'
import { createCharacterSchema } from '~/schemas/character'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const body = await validateBody(event, createCharacterSchema)
  const character = await CharacterService.create(projectId, body, userId)
  return ok(character)
})
