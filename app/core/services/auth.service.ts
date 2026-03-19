import { hash, compare } from 'bcryptjs'
import { UserModel } from '../models/user.model'
import { badRequestError } from '../errors'
import { toUserPublic } from '../types'
import type { CreateUserInput, LoginInput, UserPublic } from '../types'

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
    return toUserPublic(user)
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

    return toUserPublic(user)
  },

  async getUser(userId: string): Promise<UserPublic | null> {
    const user = await UserModel.findById(userId)
    if (user && !user.is_active) return null
    return user ? toUserPublic(user) : null
  },
}
