import { api } from '../lib/api-client.js'

export const propVariantTools = [
  {
    name: 'list_prop_variants',
    description: '列出道具的所有变体（样式/状态/角度/细节等不同版本）',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        prop_id: { type: 'string', description: '道具 ID' },
      },
      required: ['project_id', 'prop_id'],
    },
  },
  {
    name: 'create_prop_variant',
    description: '为道具创建新变体，如不同样式/状态/角度版本',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        prop_id: { type: 'string', description: '道具 ID' },
        name: { type: 'string', description: '变体名称（如"特写版"、"破损版"）' },
        description: { type: 'string', description: '变体描述' },
        image_prompt: { type: 'string', description: '图片生成提示词' },
        variant_type: { type: 'string', enum: ['style', 'condition', 'angle', 'detail'], description: '变体类型：style=样式，condition=状态，angle=角度，detail=细节' },
        sort_order: { type: 'number', description: '排序' },
        review_status: { type: 'string', enum: ['draft', 'in_review', 'confirmed'], description: '评审状态: draft | in_review | confirmed' },
      },
      required: ['project_id', 'prop_id', 'name'],
    },
  },
  {
    name: 'update_prop_variant',
    description: '更新道具变体信息或提示词',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        prop_id: { type: 'string', description: '道具 ID' },
        variant_id: { type: 'string', description: '变体 ID' },
        name: { type: 'string', description: '变体名称' },
        description: { type: 'string', description: '变体描述' },
        image_prompt: { type: 'string', description: '图片生成提示词' },
        variant_type: { type: 'string', enum: ['style', 'condition', 'angle', 'detail'], description: '变体类型' },
        sort_order: { type: 'number', description: '排序' },
        is_active: { type: 'boolean', description: '是否启用' },
        review_status: { type: 'string', enum: ['draft', 'in_review', 'confirmed'], description: '评审状态: draft | in_review | confirmed' },
      },
      required: ['project_id', 'prop_id', 'variant_id'],
    },
  },
  {
    name: 'delete_prop_variant',
    description: '删除道具变体',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        prop_id: { type: 'string', description: '道具 ID' },
        variant_id: { type: 'string', description: '变体 ID' },
      },
      required: ['project_id', 'prop_id', 'variant_id'],
    },
  },
]

export async function handlePropVariantTool(name: string, args: Record<string, unknown>): Promise<string> {
  const pid = args.project_id as string
  const propId = args.prop_id as string
  switch (name) {
    case 'list_prop_variants':
      return JSON.stringify(await api.get(`/api/projects/${pid}/props/${propId}/variants`), null, 2)
    case 'create_prop_variant': {
      const { project_id, prop_id, ...data } = args
      return JSON.stringify(await api.post(`/api/projects/${pid}/props/${propId}/variants`, data), null, 2)
    }
    case 'update_prop_variant': {
      const { project_id, prop_id, variant_id, ...data } = args
      return JSON.stringify(await api.put(`/api/projects/${pid}/props/${propId}/variants/${variant_id}`, data), null, 2)
    }
    case 'delete_prop_variant': {
      const vid = args.variant_id as string
      return JSON.stringify(await api.del(`/api/projects/${pid}/props/${propId}/variants/${vid}`), null, 2)
    }
    default:
      throw new Error(`Unknown prop-variant tool: ${name}`)
  }
}
