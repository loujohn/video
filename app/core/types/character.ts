export interface Character {
  id: string
  project_id: string
  name: string
  age: number | null
  appearance: string | null
  personality_tags: string[]
  public_identity: string | null
  real_identity: string | null
  motivation: string | null
  conflict_point: string | null
  catchphrase: string | null
  arc_description: string | null
  villain_level: number | null
  image_prompt: string | null
  assigned_to: string | null
  assigned_to_name?: string | null
  sort_order: number
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface CharacterRelation {
  id: string
  project_id: string
  from_character_id: string
  to_character_id: string
  relation_type: string
  description: string | null
}

export interface CreateCharacterInput {
  name: string
  age?: number | null
  appearance?: string
  personality_tags?: string[]
  public_identity?: string
  real_identity?: string
  motivation?: string
  conflict_point?: string
  catchphrase?: string
  arc_description?: string
  villain_level?: number | null
  image_prompt?: string
  sort_order?: number
  assigned_to?: string | null
}
