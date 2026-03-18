export interface User {
  id: string
  email: string
  name: string
  avatar: string | null
  password_hash: string
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
