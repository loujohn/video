import { TeamService } from '~/core/services/team.service'
import { ok } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const teams = await TeamService.getUserTeams(userId)
  return ok(teams)
})
