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

  async create(input: Omit<CreateUserInput, 'password'> & { password_hash: string; role?: string }): Promise<User> {
    const [user] = await getDb()(TABLE)
      .insert({
        email: input.email,
        name: input.name,
        password_hash: input.password_hash,
        role: input.role || 'user',
      })
      .returning('*')
    return user
  },

  async update(id: string, data: Record<string, any>): Promise<User | undefined> {
    const [user] = await getDb()(TABLE)
      .where({ id })
      .update({ ...data, updated_at: new Date() })
      .returning('*')
    return user
  },

  async countAll(): Promise<number> {
    const result = await getDb()(TABLE).count('id as count').first()
    return Number(result?.count || 0)
  },

  async findAll(filters: {
    q?: string
    role?: string
    is_active?: boolean
    page: number
    pageSize: number
  }): Promise<{ users: any[]; total: number }> {
    const query = getDb()(TABLE).select(
      'id', 'email', 'name', 'avatar', 'role', 'is_active', 'created_at', 'updated_at',
    )

    if (filters.q) {
      query.where(function () {
        this.where('name', 'ilike', `%${filters.q}%`)
          .orWhere('email', 'ilike', `%${filters.q}%`)
      })
    }
    if (filters.role) {
      query.where('role', filters.role)
    }
    if (filters.is_active !== undefined) {
      query.where('is_active', filters.is_active)
    }

    const countQuery = query.clone().clearSelect().clearOrder().count('id as count').first()
    const total = Number((await countQuery)?.count || 0)

    const users = await query
      .orderBy('created_at', 'desc')
      .limit(filters.pageSize)
      .offset((filters.page - 1) * filters.pageSize)

    return { users, total }
  },

  async delete(id: string): Promise<boolean> {
    const count = await getDb()(TABLE).where({ id }).del()
    return count > 0
  },

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await getDb()(TABLE).where({ id }).update({
      password_hash: passwordHash,
      updated_at: new Date(),
    })
  },
}
