import { CharacterService } from '~/core/services/character.service'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const characters = await CharacterService.list(projectId, userId)
  return ok(characters)
})
