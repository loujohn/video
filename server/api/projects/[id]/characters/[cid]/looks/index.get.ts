import { CharacterLookService } from '~/core/services/character-look.service'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const characterId = getRouterParam(event, 'cid')!
  return ok(await CharacterLookService.list(projectId, characterId, userId))
})
