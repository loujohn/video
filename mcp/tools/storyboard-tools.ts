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
    default:
      throw new Error(`Unknown storyboard tool: ${name}`)
  }
}
