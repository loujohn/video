import { api } from '../lib/api-client.js'

export const sceneVariantTools = [
  {
    name: 'list_scene_variants',
    description: '列出场景的所有变体（时间/天气/角度等不同版本）',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        scene_id: { type: 'string', description: '场景 ID' },
      },
      required: ['project_id', 'scene_id'],
    },
  },
  {
    name: 'create_scene_variant',
    description: '为场景创建新变体，如不同时间/天气/角度版本',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        scene_id: { type: 'string', description: '场景 ID' },
        name: { type: 'string', description: '变体名称（如"咖啡厅-夜晚"）' },
        description: { type: 'string', description: '变体描述' },
        image_prompt: { type: 'string', description: '图片生成提示词' },
        variant_type: { type: 'string', enum: ['time', 'weather', 'angle', 'composition'], description: '变体类型：time=时间，weather=天气，angle=角度，composition=构图' },
        sort_order: { type: 'number', description: '排序' },
        review_status: { type: 'string', enum: ['pending', 'approved'], description: '审核状态: pending(待审核) | approved(已通过)' },
      },
      required: ['project_id', 'scene_id', 'name'],
    },
  },
  {
    name: 'update_scene_variant',
    description: '更新场景变体信息或提示词',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        scene_id: { type: 'string', description: '场景 ID' },
        variant_id: { type: 'string', description: '变体 ID' },
        name: { type: 'string', description: '变体名称' },
        description: { type: 'string', description: '变体描述' },
        image_prompt: { type: 'string', description: '图片生成提示词' },
        variant_type: { type: 'string', enum: ['time', 'weather', 'angle', 'composition'], description: '变体类型：time=时间，weather=天气，angle=角度，composition=构图' },
        sort_order: { type: 'number', description: '排序' },
        is_active: { type: 'boolean', description: '是否启用' },
        review_status: { type: 'string', enum: ['pending', 'approved'], description: '审核状态: pending(待审核) | approved(已通过)' },
      },
      required: ['project_id', 'scene_id', 'variant_id'],
    },
  },
  {
    name: 'delete_scene_variant',
    description: '删除场景变体',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        scene_id: { type: 'string', description: '场景 ID' },
        variant_id: { type: 'string', description: '变体 ID' },
      },
      required: ['project_id', 'scene_id', 'variant_id'],
    },
  },
]

export async function handleSceneVariantTool(name: string, args: Record<string, unknown>): Promise<string> {
  const pid = args.project_id as string
  const sid = args.scene_id as string
  switch (name) {
    case 'list_scene_variants':
      return JSON.stringify(await api.get(`/api/projects/${pid}/scenes/${sid}/variants`), null, 2)
    case 'create_scene_variant': {
      const { project_id, scene_id, ...data } = args
      return JSON.stringify(await api.post(`/api/projects/${pid}/scenes/${sid}/variants`, data), null, 2)
    }
    case 'update_scene_variant': {
      const { project_id, scene_id, variant_id, ...data } = args
      return JSON.stringify(await api.put(`/api/projects/${pid}/scenes/${sid}/variants/${variant_id}`, data), null, 2)
    }
    case 'delete_scene_variant': {
      const vid = args.variant_id as string
      return JSON.stringify(await api.del(`/api/projects/${pid}/scenes/${sid}/variants/${vid}`), null, 2)
    }
    default:
      throw new Error(`Unknown scene-variant tool: ${name}`)
  }
}
