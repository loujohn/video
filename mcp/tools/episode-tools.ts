import { api } from '../lib/api-client.js'

export const episodeTools = [
  {
    name: 'list_episodes',
    description: '列出项目中的所有分集',
    inputSchema: {
      type: 'object' as const,
      properties: { project_id: { type: 'string', description: '项目 ID' } },
      required: ['project_id'],
    },
  },
  {
    name: 'create_episode',
    description: '创建新分集',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        episode_number: { type: 'number', description: '集号' },
        title: { type: 'string', description: '标题' },
        synopsis: { type: 'string', description: '概要' },
        hook_type: { type: 'string', description: '钩子类型 (悬念钩/反转钩/情绪钩/信息钩/危机钩)' },
        is_key_episode: { type: 'boolean', description: '是否重点集' },
        is_paywall: { type: 'boolean', description: '是否付费卡点' },
        act: { type: 'number', description: '所属幕 (1/2/3)' },
        rhythm_phase: { type: 'string', description: '节奏段落 (起势/攀升/风暴/决战)' },
      },
      required: ['project_id', 'episode_number'],
    },
  },
  {
    name: 'get_episode',
    description: '获取分集详情',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        episode_number: { type: 'number', description: '集号' },
      },
      required: ['project_id', 'episode_number'],
    },
  },
  {
    name: 'update_episode',
    description: '更新分集信息',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        episode_number: { type: 'number', description: '集号' },
        title: { type: 'string', description: '标题' },
        synopsis: { type: 'string', description: '概要' },
        hook_type: { type: 'string', description: '钩子类型' },
        is_key_episode: { type: 'boolean', description: '是否重点集' },
        is_paywall: { type: 'boolean', description: '是否付费卡点' },
        act: { type: 'number', description: '所属幕' },
        rhythm_phase: { type: 'string', description: '节奏段落' },
      },
      required: ['project_id', 'episode_number'],
    },
  },
  {
    name: 'delete_episode',
    description: '删除分集',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        episode_number: { type: 'number', description: '集号' },
      },
      required: ['project_id', 'episode_number'],
    },
  },
  {
    name: 'save_episode_script',
    description: '保存分集剧本',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        episode_number: { type: 'number', description: '集号' },
        content: { type: 'string', description: '剧本内容' },
        change_summary: { type: 'string', description: '变更摘要' },
      },
      required: ['project_id', 'episode_number', 'content'],
    },
  },
  {
    name: 'get_episode_script',
    description: '获取分集最新剧本',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        episode_number: { type: 'number', description: '集号' },
      },
      required: ['project_id', 'episode_number'],
    },
  },
]

export async function handleEpisodeTool(name: string, args: Record<string, unknown>): Promise<string> {
  const pid = args.project_id as string
  switch (name) {
    case 'list_episodes':
      return JSON.stringify(await api.get(`/api/projects/${pid}/episodes`), null, 2)
    case 'create_episode': {
      const { project_id, ...data } = args
      return JSON.stringify(await api.post(`/api/projects/${pid}/episodes`, data), null, 2)
    }
    case 'get_episode':
      return JSON.stringify(await api.get(`/api/projects/${pid}/episodes/${args.episode_number}`), null, 2)
    case 'update_episode': {
      const { project_id, episode_number, ...data } = args
      return JSON.stringify(await api.put(`/api/projects/${pid}/episodes/${episode_number}`, data), null, 2)
    }
    case 'delete_episode':
      return JSON.stringify(await api.del(`/api/projects/${pid}/episodes/${args.episode_number}`), null, 2)
    case 'save_episode_script': {
      const num = args.episode_number
      return JSON.stringify(
        await api.post(`/api/projects/${pid}/episodes/${num}/scripts`, {
          content: args.content,
          change_summary: args.change_summary,
        }),
        null,
        2,
      )
    }
    case 'get_episode_script': {
      const num = args.episode_number
      return JSON.stringify(await api.get(`/api/projects/${pid}/episodes/${num}/scripts`), null, 2)
    }
    default:
      throw new Error(`Unknown episode tool: ${name}`)
  }
}
