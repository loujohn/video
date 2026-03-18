import { api } from '../lib/api-client.js'

export const versionTools = [
  {
    name: 'get_version_history',
    description: '查看实体的版本历史（创作方案或剧本的历史版本）',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        entity_type: { type: 'string', description: '实体类型: creative_plan | episode_script' },
        entity_id: { type: 'string', description: '实体 ID' },
      },
      required: ['project_id', 'entity_type', 'entity_id'],
    },
  },
]

export async function handleVersionTool(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case 'get_version_history': {
      const pid = args.project_id as string
      const qs = `entity_type=${args.entity_type}&entity_id=${args.entity_id}`
      return JSON.stringify(await api.get(`/api/projects/${pid}/versions?${qs}`), null, 2)
    }
    default:
      throw new Error(`Unknown version tool: ${name}`)
  }
}
