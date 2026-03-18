import { CharacterService } from '~/core/services/character.service'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const characterId = getRouterParam(event, 'cid')!
  await CharacterService.delete(projectId, characterId, userId)
  return ok({ deleted: true })
})
