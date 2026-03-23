import { api } from '../lib/api-client.js'

export const storyboardTools = [
  {
    name: 'list_storyboards',
    description: '列出分集中的所有分镜',
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
    name: 'create_storyboard',
    description: '创建新分镜',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        episode_number: { type: 'number', description: '集号' },
        shot_type: { type: 'string', description: '镜头类型 (close/medium/wide/pov/establishing)' },
        description: { type: 'string', description: '画面描述' },
        dialogue: { type: 'string', description: '台词' },
        action_direction: { type: 'string', description: '动作指示' },
        music_cue: { type: 'string', description: '音效/音乐' },
        duration_seconds: { type: 'number', description: '时长（秒）' },
        camera_movement: { type: 'string', description: '镜头运动' },
        transition_type: { type: 'string', description: '转场类型 (cut/dissolve/fade/wipe)' },
        scene_id: { type: 'string', description: '关联场景 ID' },
        scene_variant_id: { type: 'string', description: '关联场景变体 ID（设置后自动推导 scene_id）' },
        character_look_ids: { type: 'array', items: { type: 'string' }, description: '关联角色形象 ID 数组' },
        prop_variant_ids: { type: 'array', items: { type: 'string' }, description: '关联道具变体 ID 数组' },
        assigned_to: { type: 'string', description: '负责人用户 ID (UUID)' },
      },
      required: ['project_id', 'episode_number'],
    },
  },
  {
    name: 'get_storyboard',
    description: '获取分镜详情',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        episode_number: { type: 'number', description: '集号' },
        storyboard_id: { type: 'string', description: '分镜 ID' },
      },
      required: ['project_id', 'episode_number', 'storyboard_id'],
    },
  },
  {
    name: 'update_storyboard',
    description: '更新分镜',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        episode_number: { type: 'number', description: '集号' },
        storyboard_id: { type: 'string', description: '分镜 ID' },
        shot_type: { type: 'string', description: '镜头类型' },
        description: { type: 'string', description: '画面描述' },
        dialogue: { type: 'string', description: '台词' },
        action_direction: { type: 'string', description: '动作指示' },
        music_cue: { type: 'string', description: '音效/音乐' },
        duration_seconds: { type: 'number', description: '时长（秒）' },
        camera_movement: { type: 'string', description: '镜头运动' },
        transition_type: { type: 'string', description: '转场类型' },
        scene_id: { type: 'string', description: '关联场景 ID' },
        scene_variant_id: { type: 'string', description: '关联场景变体 ID（设置后自动推导 scene_id）' },
        character_look_ids: { type: 'array', items: { type: 'string' }, description: '关联角色形象 ID 数组' },
        prop_variant_ids: { type: 'array', items: { type: 'string' }, description: '关联道具变体 ID 数组' },
        assigned_to: { type: 'string', description: '负责人用户 ID (UUID)' },
      },
      required: ['project_id', 'episode_number', 'storyboard_id'],
    },
  },
  {
    name: 'delete_storyboard',
    description: '删除分镜',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        episode_number: { type: 'number', description: '集号' },
        storyboard_id: { type: 'string', description: '分镜 ID' },
      },
      required: ['project_id', 'episode_number', 'storyboard_id'],
    },
  },
  {
    name: 'reorder_storyboards',
    description: '重排分镜顺序',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        episode_number: { type: 'number', description: '集号' },
        order: { type: 'array', items: { type: 'string' }, description: '分镜 ID 排序数组' },
      },
      required: ['project_id', 'episode_number', 'order'],
    },
  },
  {
    name: 'export_storyboards',
    description: '导出分集的分镜数据',
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

export async function handleStoryboardTool(name: string, args: Record<string, unknown>): Promise<string> {
  const pid = args.project_id as string
  const num = args.episode_number
  switch (name) {
    case 'list_storyboards':
      return JSON.stringify(await api.get(`/api/projects/${pid}/episodes/${num}/storyboards`), null, 2)
    case 'create_storyboard': {
      const { project_id, episode_number, ...data } = args
      return JSON.stringify(await api.post(`/api/projects/${pid}/episodes/${num}/storyboards`, data), null, 2)
    }
    case 'get_storyboard':
      return JSON.stringify(await api.get(`/api/projects/${pid}/episodes/${num}/storyboards/${args.storyboard_id}`), null, 2)
    case 'update_storyboard': {
      const { project_id, episode_number, storyboard_id, ...data } = args
      return JSON.stringify(await api.put(`/api/projects/${pid}/episodes/${num}/storyboards/${storyboard_id}`, data), null, 2)
    }
    case 'delete_storyboard':
      return JSON.stringify(await api.del(`/api/projects/${pid}/episodes/${num}/storyboards/${args.storyboard_id}`), null, 2)
    case 'reorder_storyboards':
      return JSON.stringify(await api.put(`/api/projects/${pid}/episodes/${num}/storyboards/reorder`, { order: args.order }), null, 2)
    case 'export_storyboards':
      return JSON.stringify(await api.get(`/api/projects/${pid}/episodes/${num}/storyboards/export`), null, 2)
    default:
      throw new Error(`Unknown storyboard tool: ${name}`)
  }
}
