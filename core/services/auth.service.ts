import { hash, compare } from 'bcryptjs'
import { UserModel } from '../models/user.model'
import type { CreateUserInput, LoginInput, UserPublic } from '../types'

function toPublic(user: { id: string; email: string; name: string; avatar: string | null; created_at: Date; updated_at: Date }): UserPublic {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    created_at: user.created_at,
    updated_at: user.updated_at,
  }
}

export const AuthService = {
  async register(input: CreateUserInput): Promise<UserPublic> {
    const existing = await UserModel.findByEmail(input.email)
    if (existing) {
      throw new Error('邮箱已被注册')
    }

    const password_hash = await hash(input.password, 12)
    const user = await UserModel.create({
      email: input.email,
      name: input.name,
      password_hash,
    })
    return toPublic(user)
  },

  async login(input: LoginInput): Promise<UserPublic> {
    const user = await UserModel.findByEmail(input.email)
    if (!user) {
      throw new Error('邮箱或密码错误')
    }

    const valid = await compare(input.password, user.password_hash)
    if (!valid) {
      throw new Error('邮箱或密码错误')
    }

    return toPublic(user)
  },

  async getUser(userId: string): Promise<UserPublic | null> {
    const user = await UserModel.findById(userId)
    return user ? toPublic(user) : null
  },
}
