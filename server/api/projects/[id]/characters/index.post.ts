import { CharacterService } from '~/core/services/character.service'
export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const body = await readBody(event)
  if (!body.name) badRequest('name 必填')
  const character = await CharacterService.create(projectId, body, userId)
  return ok(character)
})
