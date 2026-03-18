export interface Prop {
  id: string
  project_id: string
  name: string
  description: string | null
  tags: string[]
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface CreatePropInput {
  name: string
  description?: string
  tags?: string[]
}
