import { TeamService } from '~/core/services/team.service'
export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const teamId = getRouterParam(event, 'id')!
  const body = await readBody(event)

  const team = await TeamService.updateTeam(teamId, body, userId)
  return ok(team)
})
