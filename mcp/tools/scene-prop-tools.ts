import { api } from '../lib/api-client.js'

export const scenePropTools = [
  {
    name: 'list_scenes',
    description: '列出项目中的所有场景',
    inputSchema: {
      type: 'object' as const,
      properties: { project_id: { type: 'string', description: '项目 ID' } },
      required: ['project_id'],
    },
  },
  {
    name: 'create_scene',
    description: '创建新场景',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        name: { type: 'string', description: '场景名称' },
        location_type: { type: 'string', description: '场景类型 (interior/exterior)' },
        time_of_day: { type: 'string', description: '时间 (day/night/dawn/dusk)' },
        description: { type: 'string', description: '描述' },
        tags: { type: 'array', items: { type: 'string' }, description: '标签' },
      },
      required: ['project_id', 'name'],
    },
  },
  {
    name: 'list_props',
    description: '列出项目中的所有道具',
    inputSchema: {
      type: 'object' as const,
      properties: { project_id: { type: 'string', description: '项目 ID' } },
      required: ['project_id'],
    },
  },
  {
    name: 'create_prop',
    description: '创建新道具',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        name: { type: 'string', description: '道具名称' },
        description: { type: 'string', description: '描述' },
        tags: { type: 'array', items: { type: 'string' }, description: '标签' },
      },
      required: ['project_id', 'name'],
    },
  },
]

export async function handleScenePropTool(name: string, args: Record<string, unknown>): Promise<string> {
  const pid = args.project_id as string
  switch (name) {
    case 'list_scenes':
      return JSON.stringify(await api.get(`/api/projects/${pid}/scenes`), null, 2)
    case 'create_scene': {
      const { project_id, ...data } = args
      return JSON.stringify(await api.post(`/api/projects/${pid}/scenes`, data), null, 2)
    }
    case 'list_props':
      return JSON.stringify(await api.get(`/api/projects/${pid}/props`), null, 2)
    case 'create_prop': {
      const { project_id, ...data } = args
      return JSON.stringify(await api.post(`/api/projects/${pid}/props`, data), null, 2)
    }
    default:
      throw new Error(`Unknown scene/prop tool: ${name}`)
  }
}
