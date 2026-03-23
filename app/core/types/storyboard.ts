export interface Storyboard {
  id: string
  episode_id: string
  sequence_number: number
  shot_type: string | null
  camera_angle: string | null
  scene_id: string | null
  scene_variant_id: string | null
  description: string | null
  dialogue: string | null
  action_direction: string | null
  music_cue: string | null
  sound_effects: string | null
  notes: string | null
  duration_seconds: number | null
  reference_image_url: string | null
  camera_movement: string | null
  transition_type: string | null
  image_prompt: string | null
  assigned_to: string | null
  assigned_to_name?: string | null
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface CreateStoryboardInput {
  sequence_number?: number
  shot_type?: string
  camera_angle?: string
  scene_id?: string | null
  scene_variant_id?: string | null
  character_look_ids?: string[]
  prop_variant_ids?: string[]
  description?: string
  dialogue?: string
  action_direction?: string
  music_cue?: string
  sound_effects?: string
  notes?: string
  duration_seconds?: number | null
  reference_image_url?: string | null
  camera_movement?: string
  transition_type?: string
  image_prompt?: string
  assigned_to?: string | null
}

export interface StoryboardWithAssociations extends Storyboard {
  scene_variant?: { id: string; name: string; scene_id: string; scene_name?: string } | null
  character_looks?: Array<{ id: string; name: string; character_id: string; character_name?: string }>
  prop_variants?: Array<{ id: string; name: string; prop_id: string; prop_name?: string }>
}
