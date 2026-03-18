import { TeamService } from '~/core/services/team.service'
import { ok, badRequest } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const body = await readBody(event)

  if (!body.name) badRequest('name 必填')

  const team = await TeamService.createTeam(
    { name: body.name, description: body.description },
    userId,
  )
  return ok(team)
})
