import { hash, compare } from 'bcryptjs'
import { UserModel } from '../models/user.model'
import { badRequestError } from '../errors'
import type { CreateUserInput, LoginInput, UserPublic } from '../types'

function toPublic(user: { id: string; email: string; name: string; avatar: string | null; role: string; is_active: boolean; created_at: Date; updated_at: Date }): UserPublic {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    role: user.role as 'admin' | 'user',
    is_active: user.is_active,
    created_at: user.created_at,
    updated_at: user.updated_at,
  }
}

export const AuthService = {
  async register(input: CreateUserInput): Promise<UserPublic> {
    const existing = await UserModel.findByEmail(input.email)
    if (existing) {
      badRequestError('邮箱已被注册')
    }

    const password_hash = await hash(input.password, 12)
    const userCount = await UserModel.countAll()
    const role = userCount === 0 ? 'admin' : 'user'

    const user = await UserModel.create({
      email: input.email,
      name: input.name,
      password_hash,
      role,
    })
    return toPublic(user)
  },

  async login(input: LoginInput): Promise<UserPublic> {
    const user = await UserModel.findByEmail(input.email)
    if (!user) {
      badRequestError('邮箱或密码错误')
    }

    if (!user.is_active) {
      badRequestError('账户已被禁用')
    }

    const valid = await compare(input.password, user.password_hash)
    if (!valid) {
      badRequestError('邮箱或密码错误')
    }

    return toPublic(user)
  },

  async getUser(userId: string): Promise<UserPublic | null> {
    const user = await UserModel.findById(userId)
    if (user && !user.is_active) return null
    return user ? toPublic(user) : null
  },
}
