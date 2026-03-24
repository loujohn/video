import { describe, it, expect } from 'vitest'
import { createStoryboardSchema, updateStoryboardSchema, reorderStoryboardsSchema } from '../../server/schemas/storyboard'

describe('createStoryboardSchema', () => {
  it('accepts minimal valid input (empty)', () => {
    const result = createStoryboardSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts valid scene_variant_id', () => {
    const result = createStoryboardSchema.safeParse({
      scene_variant_id: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid scene_variant_id (not uuid)', () => {
    const result = createStoryboardSchema.safeParse({
      scene_variant_id: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })

  it('accepts null scene_variant_id', () => {
    const result = createStoryboardSchema.safeParse({ scene_variant_id: null })
    expect(result.success).toBe(true)
  })

  it('accepts valid character_look_ids array', () => {
    const result = createStoryboardSchema.safeParse({
      character_look_ids: [
        '550e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440001',
      ],
    })
    expect(result.success).toBe(true)
  })

  it('accepts empty character_look_ids array', () => {
    const result = createStoryboardSchema.safeParse({ character_look_ids: [] })
    expect(result.success).toBe(true)
  })

  it('rejects character_look_ids with invalid uuids', () => {
    const result = createStoryboardSchema.safeParse({
      character_look_ids: ['not-a-uuid'],
    })
    expect(result.success).toBe(false)
  })

  it('accepts valid prop_variant_ids array', () => {
    const result = createStoryboardSchema.safeParse({
      prop_variant_ids: ['550e8400-e29b-41d4-a716-446655440000'],
    })
    expect(result.success).toBe(true)
  })

  it('rejects prop_variant_ids with invalid uuids', () => {
    const result = createStoryboardSchema.safeParse({
      prop_variant_ids: ['bad'],
    })
    expect(result.success).toBe(false)
  })

  it('accepts full storyboard with all new association fields', () => {
    const result = createStoryboardSchema.safeParse({
      scene_id: '550e8400-e29b-41d4-a716-446655440000',
      scene_variant_id: '550e8400-e29b-41d4-a716-446655440001',
      character_look_ids: ['550e8400-e29b-41d4-a716-446655440002'],
      prop_variant_ids: ['550e8400-e29b-41d4-a716-446655440003'],
      shot_type: 'close',
      description: '测试描述',
      dialogue: '测试台词',
      duration_seconds: 5,
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid video_prompt string', () => {
    const videoPrompt = JSON.stringify({
      positive: '5s video. Close-up of face. Cold lighting.',
      negative: 'watermarks, blurry',
      duration: 5,
      camera_movement: 'slow push',
      model: 'kling',
    })
    const result = createStoryboardSchema.safeParse({ video_prompt: videoPrompt })
    expect(result.success).toBe(true)
  })

  it('accepts video_prompt up to 10000 characters', () => {
    const result = createStoryboardSchema.safeParse({ video_prompt: 'a'.repeat(10000) })
    expect(result.success).toBe(true)
  })

  it('rejects video_prompt over 10000 characters', () => {
    const result = createStoryboardSchema.safeParse({ video_prompt: 'a'.repeat(10001) })
    expect(result.success).toBe(false)
  })

  it('accepts storyboard with both image_prompt and video_prompt', () => {
    const result = createStoryboardSchema.safeParse({
      shot_type: 'close-up',
      image_prompt: 'A cinematic close-up portrait. 9:16 vertical.',
      video_prompt: JSON.stringify({ positive: 'video prompt', duration: 5 }),
      duration_seconds: 5,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.image_prompt).toBeDefined()
      expect(result.data.video_prompt).toBeDefined()
    }
  })

  it('accepts storyboard without video_prompt (optional)', () => {
    const result = createStoryboardSchema.safeParse({
      shot_type: 'wide',
      image_prompt: 'Wide shot prompt.',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.video_prompt).toBeUndefined()
    }
  })

  it('rejects description over 5000 characters', () => {
    const result = createStoryboardSchema.safeParse({ description: 'a'.repeat(5001) })
    expect(result.success).toBe(false)
  })

  it('rejects negative duration_seconds', () => {
    const result = createStoryboardSchema.safeParse({ duration_seconds: -1 })
    expect(result.success).toBe(false)
  })

  it('accepts null duration_seconds', () => {
    const result = createStoryboardSchema.safeParse({ duration_seconds: null })
    expect(result.success).toBe(true)
  })
})

describe('updateStoryboardSchema', () => {
  it('accepts empty update', () => {
    const result = updateStoryboardSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts partial update with just character_look_ids', () => {
    const result = updateStoryboardSchema.safeParse({
      character_look_ids: ['550e8400-e29b-41d4-a716-446655440000'],
    })
    expect(result.success).toBe(true)
  })

  it('accepts partial update with just video_prompt', () => {
    const result = updateStoryboardSchema.safeParse({
      video_prompt: JSON.stringify({ positive: 'updated video prompt', duration: 3 }),
    })
    expect(result.success).toBe(true)
  })
})

describe('reorderStoryboardsSchema', () => {
  it('accepts valid ids array', () => {
    const result = reorderStoryboardsSchema.safeParse({
      ids: ['550e8400-e29b-41d4-a716-446655440000'],
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty ids array', () => {
    const result = reorderStoryboardsSchema.safeParse({ ids: [] })
    expect(result.success).toBe(false)
  })

  it('rejects missing ids', () => {
    const result = reorderStoryboardsSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
