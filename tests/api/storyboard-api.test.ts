import { describe, it, expect } from 'vitest'
import { createStoryboardSchema, updateStoryboardSchema } from '../../server/schemas/storyboard'

describe('Storyboard API schema validation - create with video_prompt', () => {
  const validVideoPrompt = JSON.stringify({
    positive: '5s video. A young woman walks through a neon-lit alley. Rain reflects city lights.',
    negative: 'watermarks, blurry, low quality, text overlay',
    duration: 5,
    camera_movement: 'slow tracking shot',
    model: 'kling',
  })

  it('accepts create with all prompt fields', () => {
    const result = createStoryboardSchema.safeParse({
      shot_type: 'close',
      description: '雨夜霓虹巷道',
      dialogue: '你到底在隐瞒什么？',
      duration_seconds: 5,
      camera_movement: 'slow push',
      image_prompt: 'Cinematic close-up portrait in neon-lit alley, rain, 9:16 vertical.',
      video_prompt: validVideoPrompt,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.image_prompt).toBeDefined()
      expect(result.data.video_prompt).toBe(validVideoPrompt)
    }
  })

  it('accepts create with only video_prompt (no image_prompt)', () => {
    const result = createStoryboardSchema.safeParse({
      video_prompt: validVideoPrompt,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.image_prompt).toBeUndefined()
      expect(result.data.video_prompt).toBe(validVideoPrompt)
    }
  })

  it('accepts create with scene, character, prop associations and prompts', () => {
    const result = createStoryboardSchema.safeParse({
      scene_id: '550e8400-e29b-41d4-a716-446655440000',
      scene_variant_id: '550e8400-e29b-41d4-a716-446655440001',
      character_look_ids: ['550e8400-e29b-41d4-a716-446655440002'],
      prop_variant_ids: ['550e8400-e29b-41d4-a716-446655440003'],
      shot_type: 'medium',
      description: '客厅对峙',
      dialogue: '我知道了。',
      image_prompt: 'Medium shot of two characters facing each other in a modern living room.',
      video_prompt: JSON.stringify({ positive: 'two characters confrontation', duration: 3 }),
    })
    expect(result.success).toBe(true)
  })

  it('rejects video_prompt exceeding max length', () => {
    const result = createStoryboardSchema.safeParse({
      video_prompt: 'x'.repeat(10001),
    })
    expect(result.success).toBe(false)
  })

  it('accepts video_prompt at exactly max length', () => {
    const result = createStoryboardSchema.safeParse({
      video_prompt: 'x'.repeat(10000),
    })
    expect(result.success).toBe(true)
  })

  it('accepts plain text video_prompt (not necessarily JSON)', () => {
    const result = createStoryboardSchema.safeParse({
      video_prompt: 'A slow motion shot of rain falling on pavement, 5 seconds, kling model',
    })
    expect(result.success).toBe(true)
  })
})

describe('Storyboard API schema validation - update with video_prompt', () => {
  it('accepts updating only video_prompt', () => {
    const result = updateStoryboardSchema.safeParse({
      video_prompt: JSON.stringify({ positive: 'updated prompt', duration: 3, model: 'runway' }),
    })
    expect(result.success).toBe(true)
  })

  it('accepts updating video_prompt and image_prompt simultaneously', () => {
    const result = updateStoryboardSchema.safeParse({
      image_prompt: 'Updated image prompt for close-up shot.',
      video_prompt: JSON.stringify({ positive: 'updated video', negative: 'blur', duration: 4 }),
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.image_prompt).toBeDefined()
      expect(result.data.video_prompt).toBeDefined()
    }
  })

  it('accepts clearing video_prompt by omitting it', () => {
    const result = updateStoryboardSchema.safeParse({
      description: 'only updating description',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.video_prompt).toBeUndefined()
    }
  })

  it('accepts empty update (all fields optional)', () => {
    const result = updateStoryboardSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('rejects video_prompt over limit in update', () => {
    const result = updateStoryboardSchema.safeParse({
      video_prompt: 'a'.repeat(10001),
    })
    expect(result.success).toBe(false)
  })
})

describe('Storyboard API schema validation - edge cases', () => {
  it('accepts complex JSON video_prompt with nested objects', () => {
    const complexPrompt = JSON.stringify({
      positive: 'Close-up of a woman turning her head, wind blowing hair.',
      negative: 'watermarks, text, blurry, low resolution, static',
      duration: 5,
      camera_movement: 'slow dolly in',
      model: 'kling',
      model_config: {
        version: '1.5',
        aspect_ratio: '9:16',
        fps: 24,
      },
      style_reference: 'film_noir',
    })
    const result = createStoryboardSchema.safeParse({ video_prompt: complexPrompt })
    expect(result.success).toBe(true)
  })

  it('accepts unicode characters in video_prompt', () => {
    const result = createStoryboardSchema.safeParse({
      video_prompt: JSON.stringify({ positive: '近景拍摄，女主角含泪回望，慢速推进', duration: 5 }),
    })
    expect(result.success).toBe(true)
  })

  it('accepts video_prompt with special characters', () => {
    const result = createStoryboardSchema.safeParse({
      video_prompt: 'prompt with "quotes" and \'apostrophes\' and <angle> brackets & ampersands',
    })
    expect(result.success).toBe(true)
  })
})
