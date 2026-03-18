import { AuthService } from '~/core/services/auth.service'
export default defineEventHandler(async (event) => {
  const token = getTokenFromEvent(event)
  if (!token) unauthorized()

  const payload = await verifyToken(token!)
  if (!payload) unauthorized()

  const user = await AuthService.getUser(payload!.userId)
  if (!user) unauthorized()

  return ok(user)
})
