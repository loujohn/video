import { describe, it, expect } from 'vitest'
import { createSceneVariantSchema, updateSceneVariantSchema } from '../../server/schemas/scene-variant'

describe('createSceneVariantSchema', () => {
  it('accepts valid input with name only', () => {
    const result = createSceneVariantSchema.safeParse({ name: '白天版' })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = createSceneVariantSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing name', () => {
    const result = createSceneVariantSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('accepts all optional fields', () => {
    const result = createSceneVariantSchema.safeParse({
      name: '雨天版',
      description: '下雨时的咖啡厅外观',
      image_prompt: 'rainy day, cozy cafe exterior, puddles on ground',
      variant_type: 'weather',
      sort_order: 1,
    })
    expect(result.success).toBe(true)
  })

  it('accepts all valid variant_type values', () => {
    for (const type of ['time', 'weather', 'angle', 'composition']) {
      const result = createSceneVariantSchema.safeParse({ name: '变体', variant_type: type })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid variant_type', () => {
    const result = createSceneVariantSchema.safeParse({ name: '变体', variant_type: 'time_of_day' })
    expect(result.success).toBe(false)
  })

  it('rejects another invalid variant_type', () => {
    const result = createSceneVariantSchema.safeParse({ name: '变体', variant_type: 'custom' })
    expect(result.success).toBe(false)
  })

  it('rejects name over 100 characters', () => {
    const result = createSceneVariantSchema.safeParse({ name: 'a'.repeat(101) })
    expect(result.success).toBe(false)
  })

  it('rejects description over 2000 characters', () => {
    const result = createSceneVariantSchema.safeParse({ name: '变体', description: 'a'.repeat(2001) })
    expect(result.success).toBe(false)
  })
})

describe('updateSceneVariantSchema', () => {
  it('accepts empty update (all fields optional)', () => {
    const result = updateSceneVariantSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts partial update with is_active', () => {
    const result = updateSceneVariantSchema.safeParse({ is_active: false })
    expect(result.success).toBe(true)
  })

  it('rejects invalid variant_type on update', () => {
    const result = updateSceneVariantSchema.safeParse({ variant_type: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('rejects empty name if provided', () => {
    const result = updateSceneVariantSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })
})
