import { CharacterService } from '~/core/services/character.service'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const characterId = getRouterParam(event, 'cid')!
  const body = await readBody(event)
  const character = await CharacterService.update(projectId, characterId, body, userId)
  return ok(character)
})
