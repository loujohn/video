export interface Storyboard {
  id: string
  episode_id: string
  sequence_number: number
  shot_type: string | null
  scene_id: string | null
  description: string | null
  dialogue: string | null
  action_direction: string | null
  music_cue: string | null
  duration_seconds: number | null
  reference_image_url: string | null
  camera_movement: string | null
  transition_type: string | null
  image_prompt: string | null
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface CreateStoryboardInput {
  sequence_number?: number
  shot_type?: string
  scene_id?: string
  description?: string
  dialogue?: string
  action_direction?: string
  music_cue?: string
  duration_seconds?: number
  reference_image_url?: string
  camera_movement?: string
  transition_type?: string
  image_prompt?: string
}
