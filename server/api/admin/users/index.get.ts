import { AdminService } from '~/core/services/admin.service'
import { listUsersSchema } from '~~/server/schemas/admin'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const parsed = listUsersSchema.safeParse(query)
  if (!parsed.success) {
    const messages = parsed.error.issues
      .map((i: any) => `${i.path.join('.')}: ${i.message}`)
      .join('; ')
    badRequest(messages)
  }
  const filters = parsed.data!

  const { users, total } = await AdminService.listUsers({
    q: filters.q,
    role: filters.role,
    is_active: filters.is_active,
    page: filters.page,
    perPage: filters.per_page,
  })

  return paginated(users, total, filters.page, filters.per_page)
})
