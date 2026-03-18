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
    default:
      throw new Error(`Unknown asset tool: ${name}`)
  }
}
