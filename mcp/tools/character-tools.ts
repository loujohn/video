import { api } from '../lib/api-client.js'

export const characterTools = [
  {
    name: 'list_characters',
    description: '列出项目中的所有角色',
    inputSchema: {
      type: 'object' as const,
      properties: { project_id: { type: 'string', description: '项目 ID' } },
      required: ['project_id'],
    },
  },
  {
    name: 'create_character',
    description: '创建新角色',
    inputSchema: {
      type: 'object' as const,
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
      type: 'object' as const,
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
    name: 'set_character_relations',
    description: '批量设置角色之间的关系',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        relations: {
          type: 'array',
          description: '关系数组',
          items: {
            type: 'object',
            properties: {
              from_character_id: { type: 'string' },
              to_character_id: { type: 'string' },
              relation_type: { type: 'string' },
              description: { type: 'string' },
            },
            required: ['from_character_id', 'to_character_id', 'relation_type'],
          },
        },
      },
      required: ['project_id', 'relations'],
    },
  },
]

export async function handleCharacterTool(name: string, args: Record<string, unknown>): Promise<string> {
  const pid = args.project_id as string
  switch (name) {
    case 'list_characters':
      return JSON.stringify(await api.get(`/api/projects/${pid}/characters`), null, 2)
    case 'create_character': {
      const { project_id, ...data } = args
      return JSON.stringify(await api.post(`/api/projects/${pid}/characters`, data), null, 2)
    }
    case 'update_character': {
      const { project_id, character_id, ...data } = args
      return JSON.stringify(await api.put(`/api/projects/${pid}/characters/${character_id}`, data), null, 2)
    }
    case 'set_character_relations':
      return JSON.stringify(
        await api.put(`/api/projects/${pid}/character-relations`, { relations: args.relations }),
        null,
        2,
      )
    default:
      throw new Error(`Unknown character tool: ${name}`)
  }
}
