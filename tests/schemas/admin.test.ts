import { describe, it, expect } from 'vitest'
import { updateUserSchema, listUsersSchema } from '../../server/schemas/admin'

describe('updateUserSchema', () => {
  it('accepts valid name only', () => {
    const result = updateUserSchema.safeParse({ name: '新名称' })
    expect(result.success).toBe(true)
    expect(result.data!.name).toBe('新名称')
  })

  it('accepts valid role change', () => {
    const result = updateUserSchema.safeParse({ role: 'admin' })
    expect(result.success).toBe(true)
    expect(result.data!.role).toBe('admin')
  })

  it('accepts valid is_active change', () => {
    const result = updateUserSchema.safeParse({ is_active: false })
    expect(result.success).toBe(true)
    expect(result.data!.is_active).toBe(false)
  })

  it('accepts empty object (no changes)', () => {
    const result = updateUserSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts all fields combined', () => {
    const result = updateUserSchema.safeParse({ name: 'Test', role: 'user', is_active: true })
    expect(result.success).toBe(true)
  })

  it('rejects invalid role', () => {
    const result = updateUserSchema.safeParse({ role: 'superadmin' })
    expect(result.success).toBe(false)
  })

  it('rejects empty name', () => {
    const result = updateUserSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects name exceeding 50 chars', () => {
    const result = updateUserSchema.safeParse({ name: 'a'.repeat(51) })
    expect(result.success).toBe(false)
  })

  it('rejects non-boolean is_active', () => {
    const result = updateUserSchema.safeParse({ is_active: 'yes' })
    expect(result.success).toBe(false)
  })
})

describe('listUsersSchema', () => {
  it('accepts empty query (uses defaults)', () => {
    const result = listUsersSchema.safeParse({})
    expect(result.success).toBe(true)
    expect(result.data!.page).toBe(1)
    expect(result.data!.per_page).toBe(20)
  })

  it('accepts search query', () => {
    const result = listUsersSchema.safeParse({ q: 'test' })
    expect(result.success).toBe(true)
    expect(result.data!.q).toBe('test')
  })

  it('accepts role filter', () => {
    const result = listUsersSchema.safeParse({ role: 'admin' })
    expect(result.success).toBe(true)
    expect(result.data!.role).toBe('admin')
  })

  it('rejects invalid role filter', () => {
    const result = listUsersSchema.safeParse({ role: 'superadmin' })
    expect(result.success).toBe(false)
  })

  it('transforms is_active string to boolean', () => {
    const result = listUsersSchema.safeParse({ is_active: 'true' })
    expect(result.success).toBe(true)
    expect(result.data!.is_active).toBe(true)
  })

  it('transforms is_active false string', () => {
    const result = listUsersSchema.safeParse({ is_active: 'false' })
    expect(result.success).toBe(true)
    expect(result.data!.is_active).toBe(false)
  })

  it('coerces page string to number', () => {
    const result = listUsersSchema.safeParse({ page: '3' })
    expect(result.success).toBe(true)
    expect(result.data!.page).toBe(3)
  })

  it('coerces per_page string to number', () => {
    const result = listUsersSchema.safeParse({ per_page: '50' })
    expect(result.success).toBe(true)
    expect(result.data!.per_page).toBe(50)
  })

  it('rejects per_page exceeding 100', () => {
    const result = listUsersSchema.safeParse({ per_page: '200' })
    expect(result.success).toBe(false)
  })

  it('rejects page less than 1', () => {
    const result = listUsersSchema.safeParse({ page: '0' })
    expect(result.success).toBe(false)
  })

  it('accepts all filters combined', () => {
    const result = listUsersSchema.safeParse({
      q: 'search',
      role: 'user',
      is_active: 'true',
      page: '2',
      per_page: '10',
    })
    expect(result.success).toBe(true)
    expect(result.data!.q).toBe('search')
    expect(result.data!.role).toBe('user')
    expect(result.data!.is_active).toBe(true)
    expect(result.data!.page).toBe(2)
    expect(result.data!.per_page).toBe(10)
  })
})
