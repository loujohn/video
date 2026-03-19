export interface User {
  id: string
  email: string
  name: string
  avatar: string | null
  password_hash: string
  role: 'admin' | 'user'
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export type UserPublic = Omit<User, 'password_hash'>

export type UserUpdatable = Partial<Pick<User, 'name' | 'avatar' | 'role' | 'is_active'>>

export function toUserPublic(user: Omit<User, 'password_hash'> & { password_hash?: string }): UserPublic {
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

export interface CreateUserInput {
  email: string
  name: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}
