import { TeamService } from '~/core/services/team.service'
import { ok } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const teamId = getRouterParam(event, 'id')!
  const members = await TeamService.getMembers(teamId, userId)
  return ok(members)
})
