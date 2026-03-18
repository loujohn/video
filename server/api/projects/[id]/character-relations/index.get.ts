import { CharacterService } from '~/core/services/character.service'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const relations = await CharacterService.getRelations(projectId, userId)
  return ok(relations)
})
