import { tool } from 'ai'
import { z, type ZodTypeAny } from 'zod'

interface JsonSchemaProp {
  type: string
  description?: string
  items?: JsonSchemaProp
  properties?: Record<string, JsonSchemaProp>
  required?: string[]
}

interface ToolDef {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, JsonSchemaProp>
    required?: string[]
  }
}

function jsonSchemaToZod(prop: JsonSchemaProp): ZodTypeAny {
  switch (prop.type) {
    case 'string':
      return prop.description ? z.string().describe(prop.description) : z.string()
    case 'number':
    case 'integer':
      return prop.description ? z.number().describe(prop.description) : z.number()
    case 'boolean':
      return prop.description ? z.boolean().describe(prop.description) : z.boolean()
    case 'array': {
      const items = prop.items ? jsonSchemaToZod(prop.items) : z.unknown()
      return prop.description ? z.array(items).describe(prop.description) : z.array(items)
    }
    case 'object': {
      if (prop.properties) {
        const shape: Record<string, ZodTypeAny> = {}
        for (const [k, v] of Object.entries(prop.properties)) {
          shape[k] = jsonSchemaToZod(v)
        }
        return prop.description ? z.object(shape).describe(prop.description) : z.object(shape)
      }
      return prop.description ? z.record(z.unknown()).describe(prop.description) : z.record(z.unknown())
    }
    default:
      return z.unknown()
  }
}

function buildZodSchema(schema: ToolDef['inputSchema']): z.ZodObject<Record<string, ZodTypeAny>> {
  const shape: Record<string, ZodTypeAny> = {}
  const required = new Set(schema.required || [])

  for (const [k, v] of Object.entries(schema.properties || {})) {
    let field = jsonSchemaToZod(v)
    if (!required.has(k)) field = field.optional() as ZodTypeAny
    shape[k] = field
  }
  return z.object(shape)
}

type ToolExecutor = (toolName: string, args: Record<string, unknown>) => Promise<string>

export function registerTools(
  defs: ToolDef[],
  executor: ToolExecutor,
  allowed?: string[] | '*',
): Record<string, ReturnType<typeof tool>> {
  const result: Record<string, ReturnType<typeof tool>> = {}

  for (const def of defs) {
    if (allowed && allowed !== '*' && !allowed.includes(def.name)) continue

    result[def.name] = tool({
      description: def.description,
      parameters: buildZodSchema(def.inputSchema),
      execute: async (args) => {
        try {
          return await executor(def.name, args as Record<string, unknown>)
        }
        catch (err: unknown) {
          return JSON.stringify({ error: true, message: err instanceof Error ? err.message : String(err) })
        }
      },
    })
  }

  return result
}

export function getCreativeToolDefs(): ToolDef[] {
  return TOOL_DEFS
}

const TOOL_DEFS: ToolDef[] = [
  {
    name: 'list_teams',
    description: '列出所有团队',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'list_projects',
    description: '列出当前用户的所有项目',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'create_project',
    description: '创建新的短剧项目',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '项目标题' },
        team_id: { type: 'string', description: '团队 ID' },
        genre: { type: 'array', items: { type: 'string' }, description: '题材标签数组' },
        audience: { type: 'string', description: '目标受众' },
        tone: { type: 'string', description: '调性' },
        total_episodes: { type: 'number', description: '总集数' },
        mode: { type: 'string', description: '模式: domestic | overseas' },
        language: { type: 'string', description: '语言代码: zh-CN | en-US' },
      },
      required: ['title', 'team_id'],
    },
  },
  {
    name: 'get_project',
    description: '获取项目详情',
    inputSchema: {
      type: 'object',
      properties: { project_id: { type: 'string', description: '项目 ID' } },
      required: ['project_id'],
    },
  },
  {
    name: 'update_project',
    description: '更新项目信息',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        title: { type: 'string' },
        genre: { type: 'array', items: { type: 'string' } },
        audience: { type: 'string' },
        tone: { type: 'string' },
        total_episodes: { type: 'number' },
        mode: { type: 'string' },
        language: { type: 'string' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'get_creative_plan',
    description: '获取项目的当前创作方案',
    inputSchema: {
      type: 'object',
      properties: { project_id: { type: 'string', description: '项目 ID' } },
      required: ['project_id'],
    },
  },
  {
    name: 'save_creative_plan',
    description: '保存项目创作方案（包含核心概念、故事线、主题、受众、爽点设计等）',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        content: { type: 'object', description: '创作方案 JSON 内容' },
        change_summary: { type: 'string', description: '变更摘要' },
      },
      required: ['project_id', 'content'],
    },
  },
  {
    name: 'list_characters',
    description: '列出项目中的所有角色',
    inputSchema: {
      type: 'object',
      properties: { project_id: { type: 'string', description: '项目 ID' } },
      required: ['project_id'],
    },
  },
  {
    name: 'create_character',
    description: '创建新角色',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        name: { type: 'string', description: '角色名' },
        age: { type: 'number', description: '年龄' },
        appearance: { type: 'string', description: '外貌描述' },
        personality_tags: { type: 'array', items: { type: 'string' }, description: '性格标签' },
        public_identity: { type: 'string', description: '公开身份' },
        real_identity: { type: 'string', description: '真实身份' },
        motivation: { type: 'string', description: '动机' },
        conflict_point: { type: 'string', description: '冲突点' },
        catchphrase: { type: 'string', description: '口头禅' },
        arc_description: { type: 'string', description: '人物弧光' },
        villain_level: { type: 'number', description: '反派层级 (0-4)' },
      },
      required: ['project_id', 'name'],
    },
  },
  {
    name: 'update_character',
    description: '更新角色信息',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        character_id: { type: 'string', description: '角色 ID' },
        name: { type: 'string' },
        age: { type: 'number' },
        appearance: { type: 'string' },
        personality_tags: { type: 'array', items: { type: 'string' } },
        public_identity: { type: 'string' },
        real_identity: { type: 'string' },
        motivation: { type: 'string' },
        conflict_point: { type: 'string' },
        catchphrase: { type: 'string' },
        arc_description: { type: 'string' },
        villain_level: { type: 'number' },
      },
      required: ['project_id', 'character_id'],
    },
  },
  {
    name: 'get_character',
    description: '获取角色详情',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        character_id: { type: 'string', description: '角色 ID' },
      },
      required: ['project_id', 'character_id'],
    },
  },
  {
    name: 'delete_character',
    description: '删除角色',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        character_id: { type: 'string', description: '角色 ID' },
      },
      required: ['project_id', 'character_id'],
    },
  },
  {
    name: 'get_character_relations',
    description: '获取项目中所有角色之间的关系图谱',
    inputSchema: {
      type: 'object',
      properties: { project_id: { type: 'string', description: '项目 ID' } },
      required: ['project_id'],
    },
  },
  {
    name: 'set_character_relations',
    description: '设置角色之间的关系（覆盖已有关系）',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        relations: { type: 'array', items: { type: 'object' }, description: '关系数组 [{from_character_id, to_character_id, relation_type, description}]' },
      },
      required: ['project_id', 'relations'],
    },
  },
  {
    name: 'list_character_looks',
    description: '列出角色的所有形象/造型',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        character_id: { type: 'string', description: '角色 ID' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'create_character_look',
    description: '创建角色形象',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        character_id: { type: 'string', description: '角色 ID' },
        look_name: { type: 'string', description: '形象名称' },
        description: { type: 'string', description: '形象描述' },
        image_prompt: { type: 'string', description: '图片生成提示词' },
      },
      required: ['project_id', 'character_id', 'look_name'],
    },
  },
  {
    name: 'list_episodes',
    description: '列出项目中的所有分集',
    inputSchema: {
      type: 'object',
      properties: { project_id: { type: 'string', description: '项目 ID' } },
      required: ['project_id'],
    },
  },
  {
    name: 'create_episode',
    description: '创建分集',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        episode_number: { type: 'number', description: '集号' },
        title: { type: 'string', description: '分集标题' },
        synopsis: { type: 'string', description: '分集梗概' },
      },
      required: ['project_id', 'episode_number'],
    },
  },
  {
    name: 'get_episode',
    description: '获取分集详情',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        episode_number: { type: 'number', description: '集号' },
      },
      required: ['project_id', 'episode_number'],
    },
  },
  {
    name: 'update_episode',
    description: '更新分集信息',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        episode_number: { type: 'number', description: '集号' },
        title: { type: 'string' },
        synopsis: { type: 'string' },
      },
      required: ['project_id', 'episode_number'],
    },
  },
  {
    name: 'save_episode_script',
    description: '保存分集剧本',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        episode_number: { type: 'number', description: '集号' },
        content: { type: 'object', description: '剧本内容 JSON' },
        change_summary: { type: 'string', description: '变更摘要' },
      },
      required: ['project_id', 'episode_number', 'content'],
    },
  },
  {
    name: 'get_episode_script',
    description: '获取分集剧本',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        episode_number: { type: 'number', description: '集号' },
      },
      required: ['project_id', 'episode_number'],
    },
  },
  {
    name: 'list_scenes',
    description: '列出项目中的所有场景',
    inputSchema: {
      type: 'object',
      properties: { project_id: { type: 'string', description: '项目 ID' } },
      required: ['project_id'],
    },
  },
  {
    name: 'create_scene',
    description: '创建场景',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        name: { type: 'string', description: '场景名' },
        type: { type: 'string', description: '场景类型 (indoor/outdoor/virtual)' },
        description: { type: 'string', description: '场景描述' },
      },
      required: ['project_id', 'name'],
    },
  },
  {
    name: 'list_scene_variants',
    description: '列出场景的所有变体',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        scene_id: { type: 'string', description: '场景 ID' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'create_scene_variant',
    description: '创建场景变体',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        scene_id: { type: 'string', description: '场景 ID' },
        variant_label: { type: 'string', description: '变体标签 (如"白天"、"夜晚"、"雨天")' },
        description: { type: 'string', description: '变体描述' },
        image_prompt: { type: 'string', description: '图片生成提示词' },
      },
      required: ['project_id', 'scene_id', 'variant_label'],
    },
  },
  {
    name: 'list_storyboards',
    description: '列出分集中的所有分镜',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        episode_number: { type: 'number', description: '集号' },
      },
      required: ['project_id', 'episode_number'],
    },
  },
  {
    name: 'create_storyboard',
    description: '创建新分镜',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        episode_number: { type: 'number', description: '集号' },
        shot_type: { type: 'string', description: '镜头类型 (close/medium/wide/pov/establishing)' },
        description: { type: 'string', description: '画面描述' },
        dialogue: { type: 'string', description: '台词' },
        action_direction: { type: 'string', description: '动作指示' },
        duration_seconds: { type: 'number', description: '时长（秒）' },
        camera_movement: { type: 'string', description: '镜头运动' },
        scene_variant_id: { type: 'string', description: '关联场景变体 ID' },
        character_look_ids: { type: 'array', items: { type: 'string' }, description: '关联角色形象 ID 数组' },
        image_prompt: { type: 'string', description: '图片生成提示词' },
        video_prompt: { type: 'string', description: '视频生成提示词（JSON 字符串）' },
      },
      required: ['project_id', 'episode_number'],
    },
  },
  {
    name: 'update_storyboard',
    description: '更新分镜',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        episode_number: { type: 'number', description: '集号' },
        storyboard_id: { type: 'string', description: '分镜 ID' },
        shot_type: { type: 'string' },
        description: { type: 'string' },
        dialogue: { type: 'string' },
        action_direction: { type: 'string' },
        duration_seconds: { type: 'number' },
        camera_movement: { type: 'string' },
        scene_variant_id: { type: 'string' },
        character_look_ids: { type: 'array', items: { type: 'string' } },
        image_prompt: { type: 'string' },
        video_prompt: { type: 'string' },
      },
      required: ['project_id', 'episode_number', 'storyboard_id'],
    },
  },
  {
    name: 'reorder_storyboards',
    description: '重排分镜顺序',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        episode_number: { type: 'number', description: '集号' },
        storyboard_ids: { type: 'array', items: { type: 'string' }, description: '按新顺序排列的分镜 ID 数组' },
      },
      required: ['project_id', 'episode_number', 'storyboard_ids'],
    },
  },
  {
    name: 'export_storyboards',
    description: '导出分集的完整分镜表',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        episode_number: { type: 'number', description: '集号' },
      },
      required: ['project_id', 'episode_number'],
    },
  },
  {
    name: 'set_image_prompt',
    description: '设置实体的图片生成提示词',
    inputSchema: {
      type: 'object',
      properties: {
        entity_type: { type: 'string', description: '实体类型 (character_look/scene_variant/storyboard)' },
        entity_id: { type: 'string', description: '实体 ID' },
        image_prompt: { type: 'string', description: '图片生成提示词' },
      },
      required: ['entity_type', 'entity_id', 'image_prompt'],
    },
  },
  {
    name: 'set_video_prompt',
    description: '设置分镜的视频生成提示词',
    inputSchema: {
      type: 'object',
      properties: {
        storyboard_id: { type: 'string', description: '分镜 ID' },
        video_prompt: { type: 'string', description: '视频生成提示词（JSON 字符串）' },
      },
      required: ['storyboard_id', 'video_prompt'],
    },
  },
  {
    name: 'list_props',
    description: '列出项目中的所有道具',
    inputSchema: {
      type: 'object',
      properties: { project_id: { type: 'string', description: '项目 ID' } },
      required: ['project_id'],
    },
  },
  {
    name: 'create_prop',
    description: '创建道具',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        name: { type: 'string', description: '道具名' },
        category: { type: 'string', description: '类别' },
        description: { type: 'string', description: '描述' },
      },
      required: ['project_id', 'name'],
    },
  },
]
