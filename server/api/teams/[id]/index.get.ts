import { TeamService } from '~/core/services/team.service'
export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const teamId = getRouterParam(event, 'id')!
  const team = await TeamService.getTeam(teamId, userId)
  return ok(team)
})
