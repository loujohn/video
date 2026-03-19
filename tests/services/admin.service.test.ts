import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('$2a$12$mockedhash'),
}))

vi.mock('crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('crypto')>()
  return {
    ...actual,
    randomBytes: vi.fn().mockReturnValue({
      toString: () => 'abcdefghijkl_extra',
    }),
  }
})

const mockUsers: Record<string, any> = {}
let userIdCounter = 0

function resetMockUsers() {
  Object.keys(mockUsers).forEach(k => delete mockUsers[k])
  userIdCounter = 0
}

function addMockUser(overrides: Partial<any> = {}) {
  const id = `user-${++userIdCounter}`
  const user = {
    id,
    email: `user${userIdCounter}@test.com`,
    name: `User ${userIdCounter}`,
    avatar: null,
    password_hash: 'hash',
    role: 'user',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }
  mockUsers[id] = user
  return user
}

vi.mock('../../app/core/models/user.model', () => ({
  UserModel: {
    findById: vi.fn(async (id: string) => mockUsers[id] || undefined),
    findAll: vi.fn(async (filters: any) => {
      let users = Object.values(mockUsers)
      if (filters.q) {
        const q = filters.q.toLowerCase()
        users = users.filter((u: any) =>
          u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
        )
      }
      if (filters.role) {
        users = users.filter((u: any) => u.role === filters.role)
      }
      if (filters.is_active !== undefined) {
        users = users.filter((u: any) => u.is_active === filters.is_active)
      }
      const total = users.length
      const start = (filters.page - 1) * filters.pageSize
      return { users: users.slice(start, start + filters.pageSize), total }
    }),
    update: vi.fn(async (id: string, data: any) => {
      if (!mockUsers[id]) return undefined
      Object.assign(mockUsers[id], data, { updated_at: new Date() })
      return mockUsers[id]
    }),
    delete: vi.fn(async (id: string) => {
      if (!mockUsers[id]) return false
      delete mockUsers[id]
      return true
    }),
    updatePassword: vi.fn(async (id: string, hash: string) => {
      if (mockUsers[id]) mockUsers[id].password_hash = hash
    }),
  },
}))

const { AdminService } = await import('../../app/core/services/admin.service')

describe('AdminService', () => {
  beforeEach(() => {
    resetMockUsers()
    vi.clearAllMocks()
  })

  describe('listUsers', () => {
    it('returns paginated user list', async () => {
      addMockUser({ name: 'Alice' })
      addMockUser({ name: 'Bob' })
      addMockUser({ name: 'Charlie' })

      const result = await AdminService.listUsers({ page: 1, perPage: 20 })
      expect(result.users).toHaveLength(3)
      expect(result.total).toBe(3)
    })

    it('filters by role', async () => {
      addMockUser({ role: 'admin' })
      addMockUser({ role: 'user' })

      const result = await AdminService.listUsers({ role: 'admin', page: 1, perPage: 20 })
      expect(result.users).toHaveLength(1)
      expect(result.users[0].role).toBe('admin')
    })

    it('filters by search query', async () => {
      addMockUser({ name: 'Alice', email: 'alice@test.com' })
      addMockUser({ name: 'Bob', email: 'bob@test.com' })

      const result = await AdminService.listUsers({ q: 'alice', page: 1, perPage: 20 })
      expect(result.users).toHaveLength(1)
      expect(result.users[0].name).toBe('Alice')
    })

    it('does not expose password_hash', async () => {
      addMockUser()
      const result = await AdminService.listUsers({ page: 1, perPage: 20 })
      expect(result.users[0]).not.toHaveProperty('password_hash')
    })
  })

  describe('getUser', () => {
    it('returns user by id', async () => {
      const user = addMockUser({ name: 'TestUser' })
      const result = await AdminService.getUser(user.id)
      expect(result.name).toBe('TestUser')
      expect(result).not.toHaveProperty('password_hash')
    })

    it('throws for non-existent user', async () => {
      await expect(AdminService.getUser('non-existent')).rejects.toThrow('用户不存在')
    })
  })

  describe('updateUser', () => {
    it('updates user name', async () => {
      const user = addMockUser({ name: 'Old Name' })
      const result = await AdminService.updateUser(user.id, { name: 'New Name' }, 'other-admin')
      expect(result.name).toBe('New Name')
    })

    it('updates user role', async () => {
      const user = addMockUser({ role: 'user' })
      const result = await AdminService.updateUser(user.id, { role: 'admin' }, 'other-admin')
      expect(result.role).toBe('admin')
    })

    it('updates user is_active', async () => {
      const user = addMockUser({ is_active: true })
      const result = await AdminService.updateUser(user.id, { is_active: false }, 'other-admin')
      expect(result.is_active).toBe(false)
    })

    it('throws when trying to change own role', async () => {
      const admin = addMockUser({ role: 'admin' })
      await expect(
        AdminService.updateUser(admin.id, { role: 'user' }, admin.id),
      ).rejects.toThrow('不能修改自己的角色')
    })

    it('throws when trying to change own is_active', async () => {
      const admin = addMockUser({ role: 'admin' })
      await expect(
        AdminService.updateUser(admin.id, { is_active: false }, admin.id),
      ).rejects.toThrow('不能修改自己的状态')
    })

    it('allows admin to update own name', async () => {
      const admin = addMockUser({ role: 'admin', name: 'Old' })
      const result = await AdminService.updateUser(admin.id, { name: 'New' }, admin.id)
      expect(result.name).toBe('New')
    })

    it('throws for non-existent user', async () => {
      await expect(
        AdminService.updateUser('non-existent', { name: 'X' }, 'admin-id'),
      ).rejects.toThrow('用户不存在')
    })
  })

  describe('deleteUser', () => {
    it('deletes user successfully', async () => {
      const user = addMockUser()
      await AdminService.deleteUser(user.id, 'other-admin')
      expect(mockUsers[user.id]).toBeUndefined()
    })

    it('throws when trying to delete self', async () => {
      const admin = addMockUser({ role: 'admin' })
      await expect(
        AdminService.deleteUser(admin.id, admin.id),
      ).rejects.toThrow('不能删除自己的账户')
    })

    it('throws for non-existent user', async () => {
      await expect(
        AdminService.deleteUser('non-existent', 'admin-id'),
      ).rejects.toThrow('用户不存在')
    })
  })

  describe('resetPassword', () => {
    it('returns temporary password', async () => {
      const user = addMockUser()
      const tempPw = await AdminService.resetPassword(user.id, 'other-admin')
      expect(typeof tempPw).toBe('string')
      expect(tempPw.length).toBe(12)
    })

    it('throws when trying to reset own password', async () => {
      const admin = addMockUser({ role: 'admin' })
      await expect(
        AdminService.resetPassword(admin.id, admin.id),
      ).rejects.toThrow('不能重置自己的密码')
    })

    it('throws for non-existent user', async () => {
      await expect(
        AdminService.resetPassword('non-existent', 'admin-id'),
      ).rejects.toThrow('用户不存在')
    })
  })
})
