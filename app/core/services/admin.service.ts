import { hash } from 'bcryptjs'
import { randomBytes } from 'crypto'
import { UserModel } from '../models/user.model'
import { notFoundError, badRequestError } from '../errors'
import type { UserPublic } from '../types'

function toPublic(user: any): UserPublic {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    role: user.role,
    is_active: user.is_active,
    created_at: user.created_at,
    updated_at: user.updated_at,
  }
}

function generateTempPassword(): string {
  return randomBytes(9).toString('base64url').slice(0, 12)
}

export const AdminService = {
  async listUsers(filters: {
    q?: string
    role?: string
    is_active?: boolean
    page: number
    perPage: number
  }): Promise<{ users: UserPublic[]; total: number }> {
    const result = await UserModel.findAll({
      q: filters.q,
      role: filters.role,
      is_active: filters.is_active,
      page: filters.page,
      pageSize: filters.perPage,
    })
    return { users: result.users.map(toPublic), total: result.total }
  },

  async getUser(userId: string): Promise<UserPublic> {
    const user = await UserModel.findById(userId)
    if (!user) notFoundError('用户不存在')
    return toPublic(user)
  },

  async updateUser(
    userId: string,
    data: { name?: string; role?: string; is_active?: boolean },
    operatorId: string,
  ): Promise<UserPublic> {
    if (userId === operatorId) {
      if (data.role !== undefined) badRequestError('不能修改自己的角色')
      if (data.is_active !== undefined) badRequestError('不能修改自己的状态')
    }

    const user = await UserModel.findById(userId)
    if (!user) notFoundError('用户不存在')

    const updateData: Record<string, any> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.role !== undefined) updateData.role = data.role
    if (data.is_active !== undefined) updateData.is_active = data.is_active

    const updated = await UserModel.update(userId, updateData)
    if (!updated) notFoundError('用户不存在')
    return toPublic(updated)
  },

  async deleteUser(userId: string, operatorId: string): Promise<void> {
    if (userId === operatorId) badRequestError('不能删除自己的账户')

    const user = await UserModel.findById(userId)
    if (!user) notFoundError('用户不存在')

    await UserModel.delete(userId)
  },

  async resetPassword(userId: string, operatorId: string): Promise<string> {
    if (userId === operatorId) badRequestError('不能重置自己的密码')

    const user = await UserModel.findById(userId)
    if (!user) notFoundError('用户不存在')

    const tempPassword = generateTempPassword()
    const passwordHash = await hash(tempPassword, 12)
    await UserModel.updatePassword(userId, passwordHash)

    return tempPassword
  },
}
