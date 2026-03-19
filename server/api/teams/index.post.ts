import { TeamService } from '~/core/services/team.service'
import { createTeamSchema } from '~/schemas/team'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const body = await validateBody(event, createTeamSchema)
  const team = await TeamService.createTeam(body, userId)
  return ok(team)
})
