export interface CharacterLook {
  id: string
  character_id: string
  name: string
  description: string | null
  image_prompt: string | null
  is_base: boolean
  sort_order: number
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface CreateCharacterLookInput {
  name: string
  description?: string
  image_prompt?: string
  is_base?: boolean
  sort_order?: number
}
