import { api } from '../lib/api-client.js'

export const assetTools = [
  {
    name: 'list_assets',
    description: '列出项目的资源文件（图片/音频/视频）',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        type: { type: 'string', description: '类型筛选: image | audio | video' },
        category: { type: 'string', description: '分类筛选' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'get_asset',
    description: '获取资源详情',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        asset_id: { type: 'string', description: '资源 ID' },
      },
      required: ['project_id', 'asset_id'],
    },
  },
  {
    name: 'update_asset',
    description: '更新资源信息（标签、分类等）',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        asset_id: { type: 'string', description: '资源 ID' },
        filename: { type: 'string', description: '文件名' },
        category: { type: 'string', description: '分类' },
        tags: { type: 'array', items: { type: 'string' }, description: '标签' },
      },
      required: ['project_id', 'asset_id'],
    },
  },
  {
    name: 'delete_asset',
    description: '删除资源',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        asset_id: { type: 'string', description: '资源 ID' },
      },
      required: ['project_id', 'asset_id'],
    },
  },
]

export async function handleAssetTool(name: string, args: Record<string, unknown>): Promise<string> {
  const pid = args.project_id as string
  switch (name) {
    case 'list_assets': {
      const params = new URLSearchParams()
      if (args.type) params.set('type', args.type as string)
      if (args.category) params.set('category', args.category as string)
      const qs = params.toString() ? `?${params.toString()}` : ''
      return JSON.stringify(await api.get(`/api/projects/${pid}/assets${qs}`), null, 2)
    }
    case 'get_asset':
      return JSON.stringify(await api.get(`/api/projects/${pid}/assets/${args.asset_id}`), null, 2)
    case 'update_asset': {
      const { project_id, asset_id, ...data } = args
      return JSON.stringify(await api.put(`/api/projects/${pid}/assets/${asset_id}`, data), null, 2)
    }
    case 'delete_asset':
      return JSON.stringify(await api.del(`/api/projects/${pid}/assets/${args.asset_id}`), null, 2)
    default:
      throw new Error(`Unknown asset tool: ${name}`)
  }
}
