import { CharacterService } from '~/core/services/character.service'
export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const relations = await CharacterService.setRelations(projectId, body.relations || [], userId)
  return ok(relations)
})
