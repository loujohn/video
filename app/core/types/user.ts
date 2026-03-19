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

export interface CreateUserInput {
  email: string
  name: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}
