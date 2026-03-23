import { describe, it, expect } from 'vitest'
import { createPropVariantSchema, updatePropVariantSchema } from '../../server/schemas/prop-variant'

describe('createPropVariantSchema', () => {
  it('accepts valid input with name only', () => {
    const result = createPropVariantSchema.safeParse({ name: '特写版' })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = createPropVariantSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing name', () => {
    const result = createPropVariantSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('accepts all optional fields', () => {
    const result = createPropVariantSchema.safeParse({
      name: '破旧版',
      description: '经历战斗后破损的道具',
      image_prompt: 'damaged prop, worn texture',
      variant_type: 'condition',
      sort_order: 1,
    })
    expect(result.success).toBe(true)
  })

  it('accepts all valid variant_type values', () => {
    for (const type of ['style', 'condition', 'angle', 'detail']) {
      const result = createPropVariantSchema.safeParse({ name: '变体', variant_type: type })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid variant_type', () => {
    const result = createPropVariantSchema.safeParse({ name: '变体', variant_type: 'weather' })
    expect(result.success).toBe(false)
  })

  it('treats empty string variant_type as undefined (frontend compatibility)', () => {
    const result = createPropVariantSchema.safeParse({ name: '变体', variant_type: '' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.variant_type).toBeUndefined()
    }
  })

  it('rejects name over 100 characters', () => {
    const result = createPropVariantSchema.safeParse({ name: 'a'.repeat(101) })
    expect(result.success).toBe(false)
  })

  it('rejects description over 2000 characters', () => {
    const result = createPropVariantSchema.safeParse({ name: '变体', description: 'a'.repeat(2001) })
    expect(result.success).toBe(false)
  })
})

describe('updatePropVariantSchema', () => {
  it('accepts empty update (all fields optional)', () => {
    const result = updatePropVariantSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts partial update with is_active', () => {
    const result = updatePropVariantSchema.safeParse({ is_active: false })
    expect(result.success).toBe(true)
  })

  it('rejects invalid variant_type on update', () => {
    const result = updatePropVariantSchema.safeParse({ variant_type: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('accepts pending review_status', () => {
    const result = updatePropVariantSchema.safeParse({ review_status: 'pending' })
    expect(result.success).toBe(true)
  })

  it('accepts approved review_status', () => {
    const result = updatePropVariantSchema.safeParse({ review_status: 'approved' })
    expect(result.success).toBe(true)
  })

  it('rejects old draft review_status', () => {
    const result = updatePropVariantSchema.safeParse({ review_status: 'draft' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid review_status', () => {
    const result = updatePropVariantSchema.safeParse({ review_status: 'invalid' })
    expect(result.success).toBe(false)
  })
})
