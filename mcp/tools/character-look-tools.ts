import { api } from '../lib/api-client.js'

export const characterLookTools = [
  {
    name: 'list_character_looks',
    description: '列出角色的所有形象（造型），如基础形象、日常装、战斗装等',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        character_id: { type: 'string', description: '角色 ID' },
      },
      required: ['project_id', 'character_id'],
    },
  },
  {
    name: 'create_character_look',
    description: '为角色创建新形象（造型），每个形象有独立的提示词和候选图片',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        character_id: { type: 'string', description: '角色 ID' },
        name: { type: 'string', description: '形象名称（如"日常装""战斗装"）' },
        description: { type: 'string', description: '形象描述' },
        image_prompt: { type: 'string', description: '图片生成提示词' },
        is_base: { type: 'boolean', description: '是否基础形象' },
        sort_order: { type: 'number', description: '排序' },
        review_status: { type: 'string', enum: ['draft', 'in_review', 'confirmed'], description: '评审状态: draft | in_review | confirmed' },
      },
      required: ['project_id', 'character_id', 'name'],
    },
  },
  {
    name: 'update_character_look',
    description: '更新角色形象信息或提示词',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        character_id: { type: 'string', description: '角色 ID' },
        look_id: { type: 'string', description: '形象 ID' },
        name: { type: 'string', description: '形象名称' },
        description: { type: 'string', description: '形象描述' },
        image_prompt: { type: 'string', description: '图片生成提示词' },
        is_base: { type: 'boolean', description: '是否基础形象' },
        sort_order: { type: 'number', description: '排序' },
        is_active: { type: 'boolean', description: '是否启用' },
        review_status: { type: 'string', enum: ['draft', 'in_review', 'confirmed'], description: '评审状态: draft | in_review | confirmed' },
      },
      required: ['project_id', 'character_id', 'look_id'],
    },
  },
  {
    name: 'delete_character_look',
    description: '删除角色形象',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        character_id: { type: 'string', description: '角色 ID' },
        look_id: { type: 'string', description: '形象 ID' },
      },
      required: ['project_id', 'character_id', 'look_id'],
    },
  },
]

export async function handleCharacterLookTool(name: string, args: Record<string, unknown>): Promise<string> {
  const pid = args.project_id as string
  const cid = args.character_id as string
  switch (name) {
    case 'list_character_looks':
      return JSON.stringify(await api.get(`/api/projects/${pid}/characters/${cid}/looks`), null, 2)
    case 'create_character_look': {
      const { project_id, character_id, ...data } = args
      return JSON.stringify(await api.post(`/api/projects/${pid}/characters/${cid}/looks`, data), null, 2)
    }
    case 'update_character_look': {
      const { project_id, character_id, look_id, ...data } = args
      return JSON.stringify(await api.put(`/api/projects/${pid}/characters/${cid}/looks/${look_id}`, data), null, 2)
    }
    case 'delete_character_look': {
      const lid = args.look_id as string
      return JSON.stringify(await api.del(`/api/projects/${pid}/characters/${cid}/looks/${lid}`), null, 2)
    }
    default:
      throw new Error(`Unknown character-look tool: ${name}`)
  }
}
