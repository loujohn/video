import { CharacterLookService } from '~/core/services/character-look.service'
import { createCharacterLookSchema } from '~~/server/schemas/character-look'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const characterId = getRouterParam(event, 'cid')!
  const body = await validateBody(event, createCharacterLookSchema)
  return ok(await CharacterLookService.create(projectId, characterId, body, userId))
})
