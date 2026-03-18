import { TeamService } from '~/core/services/team.service'
import { ok, badRequest } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const teamId = getRouterParam(event, 'id')!
  const body = await readBody(event)

  if (!body.user_id) badRequest('user_id 必填')

  const member = await TeamService.addMember(teamId, body, userId)
  return ok(member)
})
