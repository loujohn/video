export interface SceneVariant {
  id: string
  scene_id: string
  name: string
  description: string | null
  image_prompt: string | null
  variant_type: string | null
  review_status: string
  sort_order: number
  is_active: boolean
  created_at: Date
  updated_at: Date
  cover_asset_url?: string | null
}

export interface CreateSceneVariantInput {
  name: string
  description?: string
  image_prompt?: string
  variant_type?: string
  sort_order?: number
  review_status?: string
}
