import { UserModel } from '~/core/models/user.model'
import type { H3Event } from 'h3'

export async function requireAdmin(event: H3Event): Promise<void> {
  const userId = event.context.userId
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: '未授权' })
  }
  const user = await UserModel.findById(userId)
  if (!user || user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: '需要管理员权限' })
  }
}
