import { AdminService } from '~/core/services/admin.service'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const uid = getRouterParam(event, 'uid')!
  await AdminService.deleteUser(uid, event.context.userId)
  return ok({ deleted: true })
})
