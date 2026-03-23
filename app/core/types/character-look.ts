export interface CharacterLook {
  id: string
  character_id: string
  name: string
  description: string | null
  image_prompt: string | null
  is_base: boolean
  review_status: string
  sort_order: number
  is_active: boolean
  created_at: Date
  updated_at: Date
  cover_asset_url?: string | null
}

export interface CreateCharacterLookInput {
  name: string
  description?: string
  image_prompt?: string
  is_base?: boolean
  sort_order?: number
  review_status?: string
}
