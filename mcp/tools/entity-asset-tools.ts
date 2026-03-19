import { api } from '../lib/api-client.js'

export const entityAssetTools = [
  {
    name: 'list_entity_assets',
    description: '列出实体关联的资源',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        entity_type: { type: 'string', description: '实体类型' },
        entity_id: { type: 'string', description: '实体 ID' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'batch_get_entity_assets',
    description: '批量获取多个实体的关联资源',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        entity_type: { type: 'string', description: '实体类型' },
        entity_ids: { type: 'string', description: '逗号分隔的实体 ID' },
      },
      required: ['project_id', 'entity_type', 'entity_ids'],
    },
  },
  {
    name: 'link_entity_asset',
    description: '关联资源到实体',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        entity_type: { type: 'string', description: '实体类型' },
        entity_id: { type: 'string', description: '实体 ID' },
        asset_id: { type: 'string', description: '资源 ID' },
        role: { type: 'string', description: '角色（如 reference, thumbnail）' },
      },
      required: ['project_id', 'entity_type', 'entity_id', 'asset_id'],
    },
  },
]

export async function handleEntityAssetTool(name: string, args: Record<string, unknown>): Promise<string> {
  const pid = args.project_id as string
  switch (name) {
    case 'list_entity_assets': {
      const params = new URLSearchParams()
      if (args.entity_type) params.set('entity_type', args.entity_type as string)
      if (args.entity_id) params.set('entity_id', args.entity_id as string)
      const qs = params.toString() ? `?${params.toString()}` : ''
      return JSON.stringify(await api.get(`/api/projects/${pid}/entity-assets${qs}`), null, 2)
    }
    case 'batch_get_entity_assets': {
      const params = new URLSearchParams({
        entity_type: args.entity_type as string,
        entity_ids: args.entity_ids as string,
      })
      return JSON.stringify(await api.get(`/api/projects/${pid}/entity-assets/batch?${params.toString()}`), null, 2)
    }
    case 'link_entity_asset': {
      const { project_id, ...data } = args
      return JSON.stringify(await api.put(`/api/projects/${pid}/entity-assets/link`, data), null, 2)
    }
    default:
      throw new Error(`Unknown entity-asset tool: ${name}`)
  }
}
