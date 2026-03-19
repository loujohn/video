import { describe, it, expect } from 'vitest'
import { createCharacterSchema, characterRelationSchema } from '../../server/schemas/character'

describe('createCharacterSchema', () => {
  it('accepts valid input with name only', () => {
    const result = createCharacterSchema.safeParse({ name: '林念念' })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = createCharacterSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing name', () => {
    const result = createCharacterSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('accepts all optional fields', () => {
    const result = createCharacterSchema.safeParse({
      name: '林念念',
      age: 25,
      appearance: '长发飘飘',
      personality_tags: ['倔强', '善良'],
      public_identity: '甜品店老板',
      real_identity: '集团继承人',
    })
    expect(result.success).toBe(true)
  })

  it('rejects negative age', () => {
    const result = createCharacterSchema.safeParse({ name: 'x', age: -1 })
    expect(result.success).toBe(false)
  })
})

describe('characterRelationSchema', () => {
  it('accepts valid relation', () => {
    const result = characterRelationSchema.safeParse({
      from_character_id: '550e8400-e29b-41d4-a716-446655440000',
      to_character_id: '550e8400-e29b-41d4-a716-446655440001',
      relation_type: '恋人',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing relation_type', () => {
    const result = characterRelationSchema.safeParse({
      from_character_id: '550e8400-e29b-41d4-a716-446655440000',
      to_character_id: '550e8400-e29b-41d4-a716-446655440001',
    })
    expect(result.success).toBe(false)
  })
})
