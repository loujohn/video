import { AdminService } from '~/core/services/admin.service'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const uid = getRouterParam(event, 'uid')!
  const temporaryPassword = await AdminService.resetPassword(uid, event.context.userId)
  return ok({ temporary_password: temporaryPassword })
})
