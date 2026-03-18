import { CharacterService } from '~/core/services/character.service'
export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const characterId = getRouterParam(event, 'cid')!
  await CharacterService.delete(projectId, characterId, userId)
  return ok({ deleted: true })
})
