import { AdminService } from '~/core/services/admin.service'
import { updateUserSchema } from '~~/server/schemas/admin'
import type { UserUpdatable } from '~/core/types'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const uid = getRouterParam(event, 'uid')!
  const body = await validateBody(event, updateUserSchema) as UserUpdatable
  const user = await AdminService.updateUser(uid, body, event.context.userId)
  return ok(user)
})
