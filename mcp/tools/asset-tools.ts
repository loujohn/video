import { readFile } from 'node:fs/promises'
import { basename, extname } from 'node:path'
import { api } from '../lib/api-client.js'

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
}

export const assetTools = [
  {
    name: 'upload_asset',
    description: '上传本地文件到项目资源库（支持图片/音频/视频）',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        file_path: { type: 'string', description: '本地文件的绝对路径' },
        category: { type: 'string', description: '分类，默认 general' },
        linked_entity_type: { type: 'string', description: '关联实体类型，如 character / scene / storyboard' },
        linked_entity_id: { type: 'string', description: '关联实体 ID' },
      },
      required: ['project_id', 'file_path'],
    },
  },
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
    case 'upload_asset': {
      const filePath = args.file_path as string
      const buffer = await readFile(filePath)
      const fileName = basename(filePath)
      const ext = extname(filePath).toLowerCase()
      const mime = MIME_MAP[ext] || 'application/octet-stream'

      const formData = new FormData()
      formData.append('file', new Blob([buffer], { type: mime }), fileName)
      if (args.category) formData.append('category', args.category as string)
      if (args.linked_entity_type) formData.append('linked_entity_type', args.linked_entity_type as string)
      if (args.linked_entity_id) formData.append('linked_entity_id', args.linked_entity_id as string)

      return JSON.stringify(await api.upload(`/api/projects/${pid}/assets`, formData), null, 2)
    }
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
