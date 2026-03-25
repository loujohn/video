import { describe, it, expect } from 'vitest'
import { createStoryboardSchema, updateStoryboardSchema } from '../../server/schemas/storyboard'

describe('Storyboard schema - Seedance 2.0 format validation', () => {
  const seedanceVideoPrompt = JSON.stringify({
    prompt: '@沈星落 一袭月白色素衣的少女缓步行走在山间小路上，面部稳定不变形，4K高清',
    duration: 12,
    aspect_ratio: '16:9',
    shot_structure: '多镜头叙事',
    camera_movement: '缓慢跟拍推进',
    transition_out: 'fade_black',
    references: ['@图片1 沈星落参考图'],
  })

  it('accepts Seedance 2.0 video_prompt with prompt field', () => {
    const result = createStoryboardSchema.safeParse({
      video_prompt: seedanceVideoPrompt,
      shot_type: '全景→中景',
      duration_seconds: 12,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      const parsed = JSON.parse(result.data.video_prompt!)
      expect(parsed.prompt).toContain('沈星落')
      expect(parsed.transition_out).toBe('fade_black')
      expect(parsed.duration).toBe(12)
    }
  })

  it('accepts all valid transition_type values', () => {
    const validTransitions = ['cut', 'dissolve', 'fade_black', 'fade_white', 'wipe', 'match_cut']
    for (const trans of validTransitions) {
      const result = createStoryboardSchema.safeParse({ transition_type: trans })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.transition_type).toBe(trans)
      }
    }
  })

  it('rejects transition_type exceeding max length', () => {
    const result = createStoryboardSchema.safeParse({
      transition_type: 'a'.repeat(51),
    })
    expect(result.success).toBe(false)
  })

  it('accepts video_prompt with transition_out field in JSON', () => {
    const withTransition = JSON.stringify({
      prompt: '镜头缓缓暗下，画面缓缓暗淡，镜头渐渐沉入黑暗。',
      duration: 10,
      transition_out: 'fade_black',
    })
    const result = updateStoryboardSchema.safeParse({ video_prompt: withTransition })
    expect(result.success).toBe(true)
    if (result.success) {
      const parsed = JSON.parse(result.data.video_prompt!)
      expect(parsed.transition_out).toBe('fade_black')
      expect(parsed.prompt).toContain('暗淡')
    }
  })

  it('accepts video_prompt with fade_white transition for climax scenes', () => {
    const climaxPrompt = JSON.stringify({
      prompt: '断剑爆发耀眼白光，强光从画面中心爆发，吞噬一切，画面渐渐变为纯白。',
      duration: 15,
      transition_out: 'fade_white',
      shot_structure: '多镜头叙事',
    })
    const result = createStoryboardSchema.safeParse({
      video_prompt: climaxPrompt,
      transition_type: 'fade_white',
    })
    expect(result.success).toBe(true)
  })

  it('accepts Chinese-language prompts with six-element formula structure', () => {
    const chinesePrompt = JSON.stringify({
      prompt: '@顾长安 墨蓝剑袍的俊朗青年，缓缓拔出长剑，天机门大殿内烛光摇曳，暖色调光影交织，缓慢推镜，国风水墨写意风格，面部稳定不变形，人体结构正常，动作自然流畅不僵硬，画面稳定不闪烁，4K高清',
      duration: 10,
      aspect_ratio: '16:9',
      camera_movement: '缓慢推镜',
      references: ['@图片1 顾长安参考图'],
    })
    const result = createStoryboardSchema.safeParse({
      shot_type: '中景',
      image_prompt: '@顾长安 墨蓝剑袍青年正面中景，天机门大殿内，烛光映照面容，国风水墨写意风格，4K高清',
      video_prompt: chinesePrompt,
      duration_seconds: 10,
      camera_movement: '缓慢推镜',
      transition_type: 'cut',
    })
    expect(result.success).toBe(true)
  })

  it('accepts update with only transition_type', () => {
    const result = updateStoryboardSchema.safeParse({
      transition_type: 'dissolve',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.transition_type).toBe('dissolve')
    }
  })

  it('accepts simultaneous update of transition_type and video_prompt', () => {
    const result = updateStoryboardSchema.safeParse({
      transition_type: 'fade_black',
      video_prompt: JSON.stringify({
        prompt: '测试prompt，画面缓缓暗淡。',
        transition_out: 'fade_black',
      }),
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.transition_type).toBe('fade_black')
      const parsed = JSON.parse(result.data.video_prompt!)
      expect(parsed.transition_out).toBe('fade_black')
    }
  })

  it('accepts video_prompt with multi-shot narrative format', () => {
    const multiShot = JSON.stringify({
      prompt: '第一个画面：@沈星落 月白素衣少女拔剑迎敌。切换到 第二个画面：@顾长安 从天而降，剑气震飞黑衣人。面部稳定不变形，4K高清。',
      duration: 15,
      shot_structure: '多镜头叙事',
      transition_out: 'cut',
    })
    const result = createStoryboardSchema.safeParse({ video_prompt: multiShot })
    expect(result.success).toBe(true)
    if (result.success) {
      const parsed = JSON.parse(result.data.video_prompt!)
      expect(parsed.prompt).toContain('第一个画面')
      expect(parsed.prompt).toContain('切换到')
      expect(parsed.shot_structure).toBe('多镜头叙事')
    }
  })

  it('accepts video_prompt with continuation from previous storyboard', () => {
    const continuationPrompt = JSON.stringify({
      prompt: '承接上一个画面，@顾长安 缓步走近@沈星落，目光落在断剑上。面部稳定不变形。',
      duration: 10,
      transition_out: 'fade_black',
    })
    const result = createStoryboardSchema.safeParse({ video_prompt: continuationPrompt })
    expect(result.success).toBe(true)
    if (result.success) {
      const parsed = JSON.parse(result.data.video_prompt!)
      expect(parsed.prompt).toContain('承接上一个画面')
    }
  })

  it('accepts character_look_ids with multiple characters including new female roles', () => {
    const result = createStoryboardSchema.safeParse({
      character_look_ids: [
        '550e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440003',
        '550e8400-e29b-41d4-a716-446655440004',
        '550e8400-e29b-41d4-a716-446655440005',
      ],
      description: '六人并肩站在云海之上',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.character_look_ids).toHaveLength(6)
    }
  })
})
