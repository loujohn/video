import { CharacterLookService } from '~/core/services/character-look.service'
import { updateCharacterLookSchema } from '~~/server/schemas/character-look'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const characterId = getRouterParam(event, 'cid')!
  const lookId = getRouterParam(event, 'lid')!
  const body = await validateBody(event, updateCharacterLookSchema)
  return ok(await CharacterLookService.update(projectId, characterId, lookId, body, userId))
})
