import { TeamService } from '~/core/services/team.service'
export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const teams = await TeamService.getUserTeams(userId)
  return ok(teams)
})
