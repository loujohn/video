import { api } from '../lib/api-client.js'

const PROMPT_TEMPLATES: Record<string, Record<string, string>> = {
  realistic: {
    character:
      'Photorealistic portrait of [CHARACTER_NAME], [AGE] years old, [APPEARANCE]. Professional studio lighting, shallow depth of field, 8K, detailed skin texture. Outfit: [OUTFIT]. Expression: [EXPRESSION]. Background: neutral gradient.',
    scene:
      'Photorealistic interior/exterior shot of [SCENE_NAME], [TIME_OF_DAY] lighting. [DESCRIPTION]. Cinematic composition, 8K resolution, atmospheric perspective. Style: modern Chinese drama set design.',
    prop: 'Product photography of [PROP_NAME], studio lighting, detailed texture, 8K macro shot. [DESCRIPTION]. Clean background, professional product rendering.',
    storyboard:
      'Cinematic still frame, [SHOT_TYPE] shot. [DESCRIPTION]. [CHARACTER_ACTION]. Camera: [CAMERA_MOVEMENT]. Lighting: [TIME_OF_DAY]. Film grain, anamorphic lens, 2.39:1 aspect ratio.',
  },
  anime: {
    character:
      'Anime character illustration of [CHARACTER_NAME], [AGE] years old. [APPEARANCE]. Anime style, cel shading, vibrant colors. Personality: [PERSONALITY]. By studio Ufotable quality.',
    scene:
      'Anime background art of [SCENE_NAME], [TIME_OF_DAY]. [DESCRIPTION]. Makoto Shinkai style, detailed environment, atmospheric lighting, vivid colors.',
    prop: 'Anime-style item illustration of [PROP_NAME]. [DESCRIPTION]. Clean linework, detailed shading, game item art style.',
    storyboard:
      'Anime key frame, [SHOT_TYPE]. [DESCRIPTION]. Dynamic composition, dramatic lighting, studio quality animation frame.',
  },
  watercolor: {
    character:
      'Watercolor portrait of [CHARACTER_NAME]. [APPEARANCE]. Soft brush strokes, flowing colors, artistic Chinese watercolor style. Ethereal, dreamy atmosphere.',
    scene:
      'Chinese watercolor landscape of [SCENE_NAME], [TIME_OF_DAY]. [DESCRIPTION]. Ink wash painting style, traditional Chinese art, flowing brushwork.',
    prop: 'Watercolor still life of [PROP_NAME]. [DESCRIPTION]. Delicate brushwork, soft colors, traditional painting style.',
    storyboard:
      'Watercolor illustration, [SHOT_TYPE] composition. [DESCRIPTION]. Soft palette, flowing movement, artistic storyboard style.',
  },
  '3d': {
    character:
      '3D character render of [CHARACTER_NAME], [AGE] years old. [APPEARANCE]. Pixar/Disney quality, subsurface scattering, detailed materials. Octane render, 8K.',
    scene:
      '3D environment render of [SCENE_NAME], [TIME_OF_DAY]. [DESCRIPTION]. Unreal Engine 5 quality, global illumination, ray tracing. Architectural visualization.',
    prop: '3D product render of [PROP_NAME]. [DESCRIPTION]. PBR materials, studio lighting, Octane render, floating in space.',
    storyboard:
      '3D rendered scene, [SHOT_TYPE]. [DESCRIPTION]. Cinematic camera, volumetric lighting, Unreal Engine 5 quality.',
  },
  sketch: {
    character:
      'Character design sketch of [CHARACTER_NAME]. [APPEARANCE]. Pencil drawing, concept art, multiple angles, expression sheet. Professional character design.',
    scene:
      'Architectural concept sketch of [SCENE_NAME]. [DESCRIPTION]. Pencil and ink, perspective drawing, detailed line work. Production design sketch.',
    prop: 'Prop design sketch of [PROP_NAME]. [DESCRIPTION]. Technical drawing, multiple views, pencil on paper, concept art.',
    storyboard:
      'Storyboard sketch, [SHOT_TYPE]. [DESCRIPTION]. Quick pencil drawing, dynamic composition, action lines, director storyboard style.',
  },
  cinematic: {
    character:
      'Cinematic portrait of [CHARACTER_NAME], [AGE]. [APPEARANCE]. Movie poster quality, dramatic lighting, shallow depth of field. Film color grading, anamorphic bokeh.',
    scene:
      'Cinematic establishing shot of [SCENE_NAME], [TIME_OF_DAY]. [DESCRIPTION]. Wide angle, dramatic sky, movie color grading, IMAX quality.',
    prop: 'Cinematic close-up of [PROP_NAME]. [DESCRIPTION]. Dramatic lighting, film grain, shallow depth of field, hero shot.',
    storyboard:
      'Movie still, [SHOT_TYPE]. [DESCRIPTION]. Film color grading, anamorphic lens, cinematic composition, director of photography quality.',
  },
}

const VIDEO_PROMPT_TEMPLATES: Record<string, Record<string, object>> = {
  realistic: {
    dialogue: {
      positive: '[DURATION]s video. [SHOT_TYPE] of [CHARACTER_NAME]. [DESCRIPTION]. [ACTION]. Natural lighting, cinematic film grain, shallow depth of field. Camera: [CAMERA_MOVEMENT].',
      negative: 'watermarks, blurry, low quality, text overlay, distorted faces, unnatural movement',
      duration: 5,
      camera_movement: '[CAMERA_MOVEMENT]',
      model: 'kling',
    },
    action: {
      positive: '[DURATION]s video. [SHOT_TYPE]. [DESCRIPTION]. Fast-paced, dynamic movement, sharp focus. Camera: [CAMERA_MOVEMENT]. Professional cinematography.',
      negative: 'watermarks, blurry, slow, static, text overlay',
      duration: 5,
      camera_movement: '[CAMERA_MOVEMENT]',
      model: 'kling',
    },
    establishing: {
      positive: '[DURATION]s video. Wide establishing shot of [SCENE_NAME]. [DESCRIPTION]. [TIME_OF_DAY] lighting, atmospheric perspective, cinematic sweep. Camera: slow pan.',
      negative: 'watermarks, text, blurry, people too close, indoor',
      duration: 5,
      camera_movement: 'slow pan',
      model: 'kling',
    },
    transition: {
      positive: '[DURATION]s video. [DESCRIPTION]. Smooth [TRANSITION_TYPE] transition. [TIME_OF_DAY]. Dreamlike quality.',
      negative: 'jarring cuts, watermarks, text, glitch',
      duration: 3,
      camera_movement: 'static',
      model: 'kling',
    },
  },
  anime: {
    dialogue: {
      positive: '[DURATION]s anime video. [SHOT_TYPE] of [CHARACTER_NAME]. [DESCRIPTION]. [ACTION]. Anime cel shading, vibrant colors, studio quality animation.',
      negative: 'realistic, 3D, watermarks, blurry, western cartoon style',
      duration: 5,
      camera_movement: '[CAMERA_MOVEMENT]',
      model: 'kling',
    },
    action: {
      positive: '[DURATION]s anime video. [SHOT_TYPE]. [DESCRIPTION]. Dynamic action lines, speed effects, dramatic angles. Ufotable quality animation.',
      negative: 'realistic, 3D, static, watermarks, low framerate',
      duration: 5,
      camera_movement: '[CAMERA_MOVEMENT]',
      model: 'kling',
    },
    establishing: {
      positive: '[DURATION]s anime video. Wide shot of [SCENE_NAME]. [DESCRIPTION]. Makoto Shinkai style, atmospheric, detailed background art, gentle wind effects.',
      negative: 'realistic, 3D, watermarks, people, urban decay',
      duration: 5,
      camera_movement: 'slow pan',
      model: 'kling',
    },
    transition: {
      positive: '[DURATION]s anime video. [DESCRIPTION]. Soft transition, light particles, ethereal atmosphere.',
      negative: 'realistic, jarring, watermarks, text',
      duration: 3,
      camera_movement: 'static',
      model: 'kling',
    },
  },
  cinematic: {
    dialogue: {
      positive: '[DURATION]s video. [SHOT_TYPE] of [CHARACTER_NAME]. [DESCRIPTION]. [ACTION]. Film color grading, anamorphic lens, dramatic lighting. Camera: [CAMERA_MOVEMENT].',
      negative: 'watermarks, amateur, flat lighting, overexposed, text overlay',
      duration: 5,
      camera_movement: '[CAMERA_MOVEMENT]',
      model: 'kling',
    },
    action: {
      positive: '[DURATION]s video. [SHOT_TYPE]. [DESCRIPTION]. IMAX quality, dramatic slow-motion impact moments, professional stunt choreography. Camera: [CAMERA_MOVEMENT].',
      negative: 'watermarks, cheap VFX, blurry, shaky amateur footage',
      duration: 5,
      camera_movement: '[CAMERA_MOVEMENT]',
      model: 'kling',
    },
    establishing: {
      positive: '[DURATION]s video. Aerial/crane shot of [SCENE_NAME]. [DESCRIPTION]. Golden hour, IMAX quality, sweeping vista. Camera: crane up.',
      negative: 'watermarks, flat, daytime noon, crowds',
      duration: 5,
      camera_movement: 'crane up',
      model: 'kling',
    },
    transition: {
      positive: '[DURATION]s video. [DESCRIPTION]. Match cut transition, film color grading, poetic visual rhythm.',
      negative: 'jarring, amateur, watermarks, text',
      duration: 3,
      camera_movement: 'static',
      model: 'kling',
    },
  },
}

export const imageTools = [
  {
    name: 'set_image_prompt',
    description: '设置任意实体的图片生成提示词。角色、场景、道具需要 project_id；分镜需要 project_id 和 episode_number。',
    inputSchema: {
      type: 'object' as const,
      properties: {
        entity_type: {
          type: 'string',
          enum: ['character', 'scene', 'prop', 'storyboard'],
          description: '实体类型',
        },
        entity_id: { type: 'string', description: '实体 ID' },
        image_prompt: { type: 'string', description: '图片生成提示词' },
        project_id: { type: 'string', description: '项目 ID（角色/场景/道具/分镜必需）' },
        episode_number: {
          type: 'number',
          description: '集号（仅分镜必需，用于定位分镜）',
        },
      },
      required: ['entity_type', 'entity_id', 'image_prompt', 'project_id'],
    },
  },
  {
    name: 'batch_set_image_prompts',
    description: '批量设置多个实体的图片生成提示词',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        prompts: {
          type: 'array',
          description: '提示词数组',
          items: {
            type: 'object',
            properties: {
              entity_type: {
                type: 'string',
                enum: ['character', 'scene', 'prop', 'storyboard'],
              },
              entity_id: { type: 'string' },
              image_prompt: { type: 'string' },
              episode_number: { type: 'number', description: '集号（仅分镜需要）' },
            },
            required: ['entity_type', 'entity_id', 'image_prompt'],
          },
        },
      },
      required: ['project_id', 'prompts'],
    },
  },
  {
    name: 'list_entity_images',
    description: '列出与实体关联的所有图片资源',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        entity_type: { type: 'string', description: '实体类型 (character/scene/prop/storyboard)' },
        entity_id: { type: 'string', description: '实体 ID' },
      },
      required: ['project_id', 'entity_type', 'entity_id'],
    },
  },
  {
    name: 'get_prompt_template',
    description: '获取用于生成图片的提示词模板，可作为 AI 的起点',
    inputSchema: {
      type: 'object' as const,
      properties: {
        style: {
          type: 'string',
          enum: ['realistic', 'anime', 'watercolor', '3d', 'sketch', 'cinematic'],
          description: '风格',
        },
        entity_type: {
          type: 'string',
          enum: ['character', 'scene', 'prop', 'storyboard'],
          description: '实体类型',
        },
      },
      required: ['style', 'entity_type'],
    },
  },
  {
    name: 'get_video_prompt_template',
    description: '获取用于生成视频的提示词模板（JSON 结构），支持不同风格和场景类型',
    inputSchema: {
      type: 'object' as const,
      properties: {
        style: {
          type: 'string',
          enum: ['realistic', 'anime', 'cinematic'],
          description: '视觉风格',
        },
        scene_type: {
          type: 'string',
          enum: ['dialogue', 'action', 'establishing', 'transition'],
          description: '场景类型：dialogue（对话）、action（动作）、establishing（全景建立）、transition（过渡）',
        },
      },
      required: ['style', 'scene_type'],
    },
  },
  {
    name: 'set_video_prompt',
    description: '设置分镜的视频生成提示词',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        episode_number: { type: 'number', description: '集号' },
        storyboard_id: { type: 'string', description: '分镜 ID' },
        video_prompt: { type: 'string', description: '视频生成提示词（JSON 字符串）' },
      },
      required: ['project_id', 'episode_number', 'storyboard_id', 'video_prompt'],
    },
  },
  {
    name: 'batch_set_video_prompts',
    description: '批量设置多个分镜的视频生成提示词',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        episode_number: { type: 'number', description: '集号' },
        prompts: {
          type: 'array',
          description: '提示词数组',
          items: {
            type: 'object',
            properties: {
              storyboard_id: { type: 'string' },
              video_prompt: { type: 'string' },
            },
            required: ['storyboard_id', 'video_prompt'],
          },
        },
      },
      required: ['project_id', 'episode_number', 'prompts'],
    },
  },
]

export async function handleImageTool(name: string, args: Record<string, unknown>): Promise<string> {
  const pid = args.project_id as string
  switch (name) {
    case 'set_image_prompt': {
      const entityType = args.entity_type as string
      const entityId = args.entity_id as string
      const imagePrompt = args.image_prompt as string
      const episodeNumber = args.episode_number as number | undefined

      if (entityType === 'storyboard') {
        if (episodeNumber == null || !Number.isInteger(episodeNumber) || episodeNumber < 1) {
          throw new Error('分镜类型需要提供有效的 episode_number（集号）')
        }
        return JSON.stringify(
          await api.put(
            `/api/projects/${pid}/episodes/${episodeNumber}/storyboards/${entityId}`,
            { image_prompt: imagePrompt },
          ),
          null,
          2,
        )
      }
      if (entityType === 'character') {
        return JSON.stringify(
          await api.put(`/api/projects/${pid}/characters/${entityId}`, { image_prompt: imagePrompt }),
          null,
          2,
        )
      }
      if (entityType === 'scene') {
        return JSON.stringify(
          await api.put(`/api/projects/${pid}/scenes/${entityId}`, { image_prompt: imagePrompt }),
          null,
          2,
        )
      }
      if (entityType === 'prop') {
        return JSON.stringify(
          await api.put(`/api/projects/${pid}/props/${entityId}`, { image_prompt: imagePrompt }),
          null,
          2,
        )
      }
      throw new Error(`不支持的 entity_type: ${entityType}`)
    }

    case 'batch_set_image_prompts': {
      const prompts = args.prompts as Array<{
        entity_type: string
        entity_id: string
        image_prompt: string
        episode_number?: number
      }>
      const results: unknown[] = []
      for (const p of prompts) {
        if (p.entity_type === 'storyboard') {
          if (p.episode_number == null || !Number.isInteger(p.episode_number) || p.episode_number < 1) {
            results.push({ entity_id: p.entity_id, error: '分镜需要 episode_number' })
            continue
          }
          results.push(
            await api.put(
              `/api/projects/${pid}/episodes/${p.episode_number}/storyboards/${p.entity_id}`,
              { image_prompt: p.image_prompt },
            ),
          )
        } else if (p.entity_type === 'character') {
          results.push(
            await api.put(`/api/projects/${pid}/characters/${p.entity_id}`, { image_prompt: p.image_prompt }),
          )
        } else if (p.entity_type === 'scene') {
          results.push(
            await api.put(`/api/projects/${pid}/scenes/${p.entity_id}`, { image_prompt: p.image_prompt }),
          )
        } else if (p.entity_type === 'prop') {
          results.push(
            await api.put(`/api/projects/${pid}/props/${p.entity_id}`, { image_prompt: p.image_prompt }),
          )
        } else {
          results.push({ entity_id: p.entity_id, error: `不支持的 entity_type: ${p.entity_type}` })
        }
      }
      return JSON.stringify(results, null, 2)
    }

    case 'list_entity_images': {
      const entityType = args.entity_type as string
      const entityId = args.entity_id as string
      const params = new URLSearchParams({ entity_type: entityType, entity_id: entityId })
      return JSON.stringify(
        await api.get(`/api/projects/${pid}/entity-assets?${params.toString()}`),
        null,
        2,
      )
    }

    case 'get_prompt_template': {
      const style = args.style as string
      const entityType = args.entity_type as string
      const styleTemplates = PROMPT_TEMPLATES[style]
      if (!styleTemplates) {
        throw new Error(
          `不支持的 style: ${style}。可选: realistic, anime, watercolor, 3d, sketch, cinematic`,
        )
      }
      const template = styleTemplates[entityType]
      if (!template) {
        throw new Error(
          `不支持的 entity_type: ${entityType}。可选: character, scene, prop, storyboard`,
        )
      }
      return JSON.stringify(
        {
          style,
          entity_type: entityType,
          template,
          placeholders: [
            'CHARACTER_NAME',
            'AGE',
            'APPEARANCE',
            'OUTFIT',
            'EXPRESSION',
            'PERSONALITY',
            'SCENE_NAME',
            'TIME_OF_DAY',
            'DESCRIPTION',
            'PROP_NAME',
            'SHOT_TYPE',
            'CHARACTER_ACTION',
            'CAMERA_MOVEMENT',
          ],
        },
        null,
        2,
      )
    }

    case 'get_video_prompt_template': {
      const style = args.style as string
      const sceneType = args.scene_type as string
      const styleTemplates = VIDEO_PROMPT_TEMPLATES[style]
      if (!styleTemplates) {
        throw new Error(`不支持的 style: ${style}。可选: realistic, anime, cinematic`)
      }
      const template = styleTemplates[sceneType]
      if (!template) {
        throw new Error(`不支持的 scene_type: ${sceneType}。可选: dialogue, action, establishing, transition`)
      }
      return JSON.stringify(
        {
          style,
          scene_type: sceneType,
          template,
          placeholders: [
            'DURATION', 'SHOT_TYPE', 'CHARACTER_NAME', 'DESCRIPTION',
            'ACTION', 'CAMERA_MOVEMENT', 'SCENE_NAME', 'TIME_OF_DAY', 'TRANSITION_TYPE',
          ],
          usage: '替换模板中的 [PLACEHOLDER] 占位符，然后 JSON.stringify 整个对象作为 video_prompt',
        },
        null,
        2,
      )
    }

    case 'set_video_prompt': {
      const episodeNumber = args.episode_number as number
      const storyboardId = args.storyboard_id as string
      const videoPrompt = args.video_prompt as string
      return JSON.stringify(
        await api.put(
          `/api/projects/${pid}/episodes/${episodeNumber}/storyboards/${storyboardId}`,
          { video_prompt: videoPrompt },
        ),
        null,
        2,
      )
    }

    case 'batch_set_video_prompts': {
      const episodeNumber = args.episode_number as number
      const prompts = args.prompts as Array<{ storyboard_id: string; video_prompt: string }>
      const results: unknown[] = []
      for (const p of prompts) {
        try {
          results.push(
            await api.put(
              `/api/projects/${pid}/episodes/${episodeNumber}/storyboards/${p.storyboard_id}`,
              { video_prompt: p.video_prompt },
            ),
          )
        } catch (err) {
          results.push({ storyboard_id: p.storyboard_id, error: String(err) })
        }
      }
      return JSON.stringify(results, null, 2)
    }

    default:
      throw new Error(`Unknown image tool: ${name}`)
  }
}
