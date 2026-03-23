export interface Prop {
  id: string
  project_id: string
  name: string
  description: string | null
  tags: string[]
  image_prompt: string | null
  assigned_to: string | null
  assigned_to_name?: string | null
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface CreatePropInput {
  name: string
  description?: string
  tags?: string[]
  image_prompt?: string
  assigned_to?: string | null
}
