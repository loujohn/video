import { TeamService } from '~/core/services/team.service'
export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const teamId = getRouterParam(event, 'id')!
  const members = await TeamService.getMembers(teamId, userId)
  return ok(members)
})
