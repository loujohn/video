export interface SceneVariant {
  id: string
  scene_id: string
  name: string
  description: string | null
  image_prompt: string | null
  variant_type: string | null
  sort_order: number
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface CreateSceneVariantInput {
  name: string
  description?: string
  image_prompt?: string
  variant_type?: string
  sort_order?: number
}
