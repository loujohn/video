import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('$2a$12$mockedhash'),
  compare: vi.fn(),
}))

const mockUserStore: Record<string, any> = {}
let idSeq = 0

function resetStore() {
  Object.keys(mockUserStore).forEach(k => delete mockUserStore[k])
  idSeq = 0
}

function addUser(overrides: Partial<any> = {}) {
  const id = `u-${++idSeq}`
  const user = {
    id,
    email: `user${idSeq}@test.com`,
    name: `User ${idSeq}`,
    avatar: null,
    password_hash: '$2a$12$realhash',
    role: 'user',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }
  mockUserStore[id] = user
  return user
}

vi.mock('../../app/core/models/user.model', () => ({
  UserModel: {
    findByEmail: vi.fn(async (email: string) =>
      Object.values(mockUserStore).find((u: any) => u.email === email),
    ),
    findById: vi.fn(async (id: string) => mockUserStore[id]),
    countAll: vi.fn(async () => Object.keys(mockUserStore).length),
    create: vi.fn(async (input: any) => {
      const id = `u-${++idSeq}`
      const user = {
        id,
        email: input.email,
        name: input.name,
        avatar: null,
        password_hash: input.password_hash,
        role: input.role || 'user',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      }
      mockUserStore[id] = user
      return user
    }),
  },
}))

const bcryptjs = await import('bcryptjs')
const { AuthService } = await import('../../app/core/services/auth.service')

describe('AuthService', () => {
  beforeEach(() => {
    resetStore()
    vi.clearAllMocks()
  })

  describe('register', () => {
    it('first user gets admin role', async () => {
      const result = await AuthService.register({
        email: 'first@test.com',
        name: 'First',
        password: 'password123',
      })
      expect(result.role).toBe('admin')
    })

    it('subsequent users get user role', async () => {
      addUser({ email: 'existing@test.com' })

      const result = await AuthService.register({
        email: 'second@test.com',
        name: 'Second',
        password: 'password123',
      })
      expect(result.role).toBe('user')
    })

    it('throws if email already registered', async () => {
      addUser({ email: 'taken@test.com' })

      await expect(
        AuthService.register({ email: 'taken@test.com', name: 'X', password: 'p' }),
      ).rejects.toThrow('邮箱已被注册')
    })

    it('does not expose password_hash', async () => {
      const result = await AuthService.register({
        email: 'new@test.com',
        name: 'New',
        password: 'pw',
      })
      expect(result).not.toHaveProperty('password_hash')
    })
  })

  describe('login', () => {
    it('returns user on valid credentials', async () => {
      addUser({ email: 'good@test.com', password_hash: '$2a$12$realhash' })
      vi.mocked(bcryptjs.compare).mockResolvedValue(true as never)

      const result = await AuthService.login({ email: 'good@test.com', password: 'correct' })
      expect(result.email).toBe('good@test.com')
      expect(result).not.toHaveProperty('password_hash')
    })

    it('throws on wrong email', async () => {
      await expect(
        AuthService.login({ email: 'nope@test.com', password: 'any' }),
      ).rejects.toThrow('邮箱或密码错误')
    })

    it('throws on wrong password', async () => {
      addUser({ email: 'good@test.com' })
      vi.mocked(bcryptjs.compare).mockResolvedValue(false as never)

      await expect(
        AuthService.login({ email: 'good@test.com', password: 'wrong' }),
      ).rejects.toThrow('邮箱或密码错误')
    })

    it('throws if user is disabled', async () => {
      addUser({ email: 'disabled@test.com', is_active: false })

      await expect(
        AuthService.login({ email: 'disabled@test.com', password: 'any' }),
      ).rejects.toThrow('账户已被禁用')
    })
  })

  describe('getUser', () => {
    it('returns user by id', async () => {
      const user = addUser({ name: 'Test' })
      const result = await AuthService.getUser(user.id)
      expect(result).not.toBeNull()
      expect(result!.name).toBe('Test')
    })

    it('returns null for non-existent user', async () => {
      const result = await AuthService.getUser('non-existent')
      expect(result).toBeNull()
    })

    it('returns null for disabled user', async () => {
      const user = addUser({ is_active: false })
      const result = await AuthService.getUser(user.id)
      expect(result).toBeNull()
    })

    it('does not expose password_hash', async () => {
      const user = addUser()
      const result = await AuthService.getUser(user.id)
      expect(result).not.toHaveProperty('password_hash')
    })
  })
})
