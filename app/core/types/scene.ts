export interface Scene {
  id: string
  project_id: string
  name: string
  location_type: string | null
  time_of_day: string | null
  description: string | null
  tags: string[]
  image_prompt: string | null
  assigned_to: string | null
  assigned_to_name?: string | null
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface CreateSceneInput {
  name: string
  location_type?: string
  time_of_day?: string
  description?: string
  tags?: string[]
  image_prompt?: string
  assigned_to?: string | null
}
