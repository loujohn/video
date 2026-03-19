import { describe, it, expect } from 'vitest'
import { createProjectSchema, updateProjectSchema } from '../../server/schemas/project'

describe('createProjectSchema', () => {
  it('accepts valid input with required fields', () => {
    const result = createProjectSchema.safeParse({ team_id: '550e8400-e29b-41d4-a716-446655440000', title: '测试项目' })
    expect(result.success).toBe(true)
  })

  it('rejects missing title', () => {
    const result = createProjectSchema.safeParse({ team_id: '550e8400-e29b-41d4-a716-446655440000' })
    expect(result.success).toBe(false)
  })

  it('rejects empty title', () => {
    const result = createProjectSchema.safeParse({ team_id: '550e8400-e29b-41d4-a716-446655440000', title: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing team_id', () => {
    const result = createProjectSchema.safeParse({ title: '测试' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid team_id (not uuid)', () => {
    const result = createProjectSchema.safeParse({ team_id: 'not-a-uuid', title: '测试' })
    expect(result.success).toBe(false)
  })

  it('accepts optional fields', () => {
    const result = createProjectSchema.safeParse({
      team_id: '550e8400-e29b-41d4-a716-446655440000',
      title: '测试项目',
      genre: ['悬疑', '爱情'],
      total_episodes: 24,
      tone: '轻松',
    })
    expect(result.success).toBe(true)
  })

  it('rejects total_episodes less than 1', () => {
    const result = createProjectSchema.safeParse({
      team_id: '550e8400-e29b-41d4-a716-446655440000',
      title: '测试',
      total_episodes: 0,
    })
    expect(result.success).toBe(false)
  })
})

describe('updateProjectSchema', () => {
  it('accepts partial updates', () => {
    const result = updateProjectSchema.safeParse({ title: '新标题' })
    expect(result.success).toBe(true)
  })

  it('accepts empty object (no changes)', () => {
    const result = updateProjectSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts valid status', () => {
    const result = updateProjectSchema.safeParse({ status: 'in_progress' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid status', () => {
    const result = updateProjectSchema.safeParse({ status: 'invalid' })
    expect(result.success).toBe(false)
  })
})
