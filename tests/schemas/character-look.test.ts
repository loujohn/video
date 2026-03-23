import { describe, it, expect } from 'vitest'
import { createCharacterLookSchema, updateCharacterLookSchema } from '../../server/schemas/character-look'

describe('createCharacterLookSchema', () => {
  it('accepts valid input with name only', () => {
    const result = createCharacterLookSchema.safeParse({ name: '基础形象' })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = createCharacterLookSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing name', () => {
    const result = createCharacterLookSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('accepts all optional fields', () => {
    const result = createCharacterLookSchema.safeParse({
      name: '战斗装甲',
      description: '全身钛合金铠甲',
      image_prompt: 'full body armor, silver metallic, futuristic',
      is_base: false,
      sort_order: 2,
    })
    expect(result.success).toBe(true)
  })

  it('rejects name over 100 characters', () => {
    const result = createCharacterLookSchema.safeParse({ name: 'a'.repeat(101) })
    expect(result.success).toBe(false)
  })

  it('rejects description over 2000 characters', () => {
    const result = createCharacterLookSchema.safeParse({ name: '形象', description: 'a'.repeat(2001) })
    expect(result.success).toBe(false)
  })

  it('rejects image_prompt over 5000 characters', () => {
    const result = createCharacterLookSchema.safeParse({ name: '形象', image_prompt: 'a'.repeat(5001) })
    expect(result.success).toBe(false)
  })
})

describe('updateCharacterLookSchema', () => {
  it('accepts empty update (all fields optional)', () => {
    const result = updateCharacterLookSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts partial update with only name', () => {
    const result = updateCharacterLookSchema.safeParse({ name: '新形象名' })
    expect(result.success).toBe(true)
  })

  it('accepts is_active field', () => {
    const result = updateCharacterLookSchema.safeParse({ is_active: false })
    expect(result.success).toBe(true)
  })

  it('rejects empty name if provided', () => {
    const result = updateCharacterLookSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('accepts pending review_status', () => {
    const result = updateCharacterLookSchema.safeParse({ review_status: 'pending' })
    expect(result.success).toBe(true)
  })

  it('accepts approved review_status', () => {
    const result = updateCharacterLookSchema.safeParse({ review_status: 'approved' })
    expect(result.success).toBe(true)
  })

  it('rejects old draft review_status', () => {
    const result = updateCharacterLookSchema.safeParse({ review_status: 'draft' })
    expect(result.success).toBe(false)
  })

  it('rejects old in_review review_status', () => {
    const result = updateCharacterLookSchema.safeParse({ review_status: 'in_review' })
    expect(result.success).toBe(false)
  })

  it('rejects old confirmed review_status', () => {
    const result = updateCharacterLookSchema.safeParse({ review_status: 'confirmed' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid review_status', () => {
    const result = updateCharacterLookSchema.safeParse({ review_status: 'invalid' })
    expect(result.success).toBe(false)
  })
})
