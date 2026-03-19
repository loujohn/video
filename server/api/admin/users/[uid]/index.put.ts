import { AdminService } from '~/core/services/admin.service'
import { updateUserSchema } from '~/schemas/admin'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const uid = getRouterParam(event, 'uid')!
  const body = await validateBody(event, updateUserSchema)
  const user = await AdminService.updateUser(uid, body, event.context.userId)
  return ok(user)
})
