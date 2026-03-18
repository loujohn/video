import { getDb } from '../db'
import type { User, CreateUserInput } from '../types'

const TABLE = 'users'

export const UserModel = {
  async findById(id: string): Promise<User | undefined> {
    return getDb()(TABLE).where({ id }).first()
  },

  async findByEmail(email: string): Promise<User | undefined> {
    return getDb()(TABLE).where({ email }).first()
  },

  async create(input: Omit<CreateUserInput, 'password'> & { password_hash: string }): Promise<User> {
    const [user] = await getDb()(TABLE)
      .insert({
        email: input.email,
        name: input.name,
        password_hash: input.password_hash,
      })
      .returning('*')
    return user
  },

  async update(id: string, data: Partial<Pick<User, 'name' | 'avatar'>>): Promise<User | undefined> {
    const [user] = await getDb()(TABLE)
      .where({ id })
      .update({ ...data, updated_at: new Date() })
      .returning('*')
    return user
  },
}
