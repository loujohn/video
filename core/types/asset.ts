export interface Asset {
  id: string
  project_id: string
  type: 'image' | 'audio' | 'video'
  category: string
  file_path: string
  file_name: string | null
  file_size: number | null
  mime_type: string | null
  metadata: Record<string, unknown>
  tags: string[]
  linked_entity_type: string | null
  linked_entity_id: string | null
  created_by: string | null
  is_active: boolean
  created_at: Date
}

export interface CreateAssetInput {
  type: 'image' | 'audio' | 'video'
  category: string
  file_path: string
  file_name?: string
  file_size?: number
  mime_type?: string
  metadata?: Record<string, unknown>
  tags?: string[]
  linked_entity_type?: string
  linked_entity_id?: string
}
