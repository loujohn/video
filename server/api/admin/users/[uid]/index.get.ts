import { AdminService } from '~/core/services/admin.service'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const uid = getRouterParam(event, 'uid')!
  const user = await AdminService.getUser(uid)
  return ok(user)
})
