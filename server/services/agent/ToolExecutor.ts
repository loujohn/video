const BASE_URL = process.env.NUXT_INTERNAL_URL || 'http://localhost:3000'

async function apiCall(method: string, path: string, body?: unknown): Promise<string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  const init: RequestInit = { method, headers }
  if (body !== undefined) init.body = JSON.stringify(body)

  const res = await fetch(`${BASE_URL}${path}`, init)
  const text = await res.text()

  if (!res.ok) {
    return JSON.stringify({ error: true, status: res.status, message: text.slice(0, 500) })
  }

  try {
    const json = JSON.parse(text)
    return JSON.stringify(json.data ?? json, null, 2)
  }
  catch {
    return text
  }
}

const TOOL_ROUTES: Record<string, (args: Record<string, unknown>) => Promise<string>> = {
  list_teams: () => apiCall('GET', '/api/teams'),
  list_projects: () => apiCall('GET', '/api/projects'),
  create_project: (a) => { const { team_id, ...rest } = a; return apiCall('POST', '/api/projects', { ...rest, team_id }) },
  get_project: (a) => apiCall('GET', `/api/projects/${a.project_id}`),
  update_project: (a) => { const { project_id, ...d } = a; return apiCall('PUT', `/api/projects/${project_id}`, d) },
  get_creative_plan: (a) => apiCall('GET', `/api/projects/${a.project_id}/plan`),
  save_creative_plan: (a) => apiCall('PUT', `/api/projects/${a.project_id}/plan`, { content: a.content, change_summary: a.change_summary }),
  list_characters: (a) => apiCall('GET', `/api/projects/${a.project_id}/characters`),
  create_character: (a) => { const { project_id, ...d } = a; return apiCall('POST', `/api/projects/${project_id}/characters`, d) },
  update_character: (a) => { const { project_id, character_id, ...d } = a; return apiCall('PUT', `/api/projects/${project_id}/characters/${character_id}`, d) },
  get_character: (a) => apiCall('GET', `/api/projects/${a.project_id}/characters/${a.character_id}`),
  delete_character: (a) => apiCall('DELETE', `/api/projects/${a.project_id}/characters/${a.character_id}`),
  get_character_relations: (a) => apiCall('GET', `/api/projects/${a.project_id}/characters/relations`),
  set_character_relations: (a) => apiCall('PUT', `/api/projects/${a.project_id}/characters/relations`, { relations: a.relations }),
  list_character_looks: (a) => {
    const url = a.character_id
      ? `/api/projects/${a.project_id}/characters/${a.character_id}/looks`
      : `/api/projects/${a.project_id}/character-looks`
    return apiCall('GET', url)
  },
  create_character_look: (a) => {
    const { project_id, character_id, ...d } = a
    return apiCall('POST', `/api/projects/${project_id}/characters/${character_id}/looks`, d)
  },
  list_episodes: (a) => apiCall('GET', `/api/projects/${a.project_id}/episodes`),
  create_episode: (a) => { const { project_id, ...d } = a; return apiCall('POST', `/api/projects/${project_id}/episodes`, d) },
  get_episode: (a) => apiCall('GET', `/api/projects/${a.project_id}/episodes/${a.episode_number}`),
  update_episode: (a) => { const { project_id, episode_number, ...d } = a; return apiCall('PUT', `/api/projects/${project_id}/episodes/${episode_number}`, d) },
  save_episode_script: (a) => apiCall('PUT', `/api/projects/${a.project_id}/episodes/${a.episode_number}/script`, { content: a.content, change_summary: a.change_summary }),
  get_episode_script: (a) => apiCall('GET', `/api/projects/${a.project_id}/episodes/${a.episode_number}/script`),
  list_scenes: (a) => apiCall('GET', `/api/projects/${a.project_id}/scenes`),
  create_scene: (a) => { const { project_id, ...d } = a; return apiCall('POST', `/api/projects/${project_id}/scenes`, d) },
  list_scene_variants: (a) => {
    const url = a.scene_id
      ? `/api/projects/${a.project_id}/scenes/${a.scene_id}/variants`
      : `/api/projects/${a.project_id}/scene-variants`
    return apiCall('GET', url)
  },
  create_scene_variant: (a) => {
    const { project_id, scene_id, ...d } = a
    return apiCall('POST', `/api/projects/${project_id}/scenes/${scene_id}/variants`, d)
  },
  list_storyboards: (a) => apiCall('GET', `/api/projects/${a.project_id}/episodes/${a.episode_number}/storyboards`),
  create_storyboard: (a) => { const { project_id, episode_number, ...d } = a; return apiCall('POST', `/api/projects/${project_id}/episodes/${episode_number}/storyboards`, d) },
  update_storyboard: (a) => { const { project_id, episode_number, storyboard_id, ...d } = a; return apiCall('PUT', `/api/projects/${project_id}/episodes/${episode_number}/storyboards/${storyboard_id}`, d) },
  reorder_storyboards: (a) => apiCall('PUT', `/api/projects/${a.project_id}/episodes/${a.episode_number}/storyboards/reorder`, { storyboard_ids: a.storyboard_ids }),
  export_storyboards: (a) => apiCall('GET', `/api/projects/${a.project_id}/episodes/${a.episode_number}/storyboards/export`),
  set_image_prompt: (a) => apiCall('PUT', `/api/image-prompts/${a.entity_type}/${a.entity_id}`, { image_prompt: a.image_prompt }),
  set_video_prompt: (a) => apiCall('PUT', `/api/video-prompts/${a.storyboard_id}`, { video_prompt: a.video_prompt }),
  list_props: (a) => apiCall('GET', `/api/projects/${a.project_id}/props`),
  create_prop: (a) => { const { project_id, ...d } = a; return apiCall('POST', `/api/projects/${project_id}/props`, d) },
}

export async function executeToolCall(toolName: string, args: Record<string, unknown>): Promise<string> {
  const handler = TOOL_ROUTES[toolName]
  if (!handler) {
    return JSON.stringify({ error: true, message: `Unknown tool: ${toolName}` })
  }
  return handler(args)
}
