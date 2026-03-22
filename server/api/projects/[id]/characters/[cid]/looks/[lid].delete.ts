import { CharacterLookService } from '~/core/services/character-look.service'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const characterId = getRouterParam(event, 'cid')!
  const lookId = getRouterParam(event, 'lid')!
  await CharacterLookService.delete(projectId, characterId, lookId, userId)
  return ok({ deleted: true })
})
