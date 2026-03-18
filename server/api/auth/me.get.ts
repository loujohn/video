import { AuthService } from '~/core/services/auth.service'
import { getTokenFromEvent, verifyToken } from '~/server/utils/auth'
import { ok, unauthorized } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const token = getTokenFromEvent(event)
  if (!token) unauthorized()

  const payload = await verifyToken(token!)
  if (!payload) unauthorized()

  const user = await AuthService.getUser(payload!.userId)
  if (!user) unauthorized()

  return ok(user)
})
