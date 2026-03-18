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
  linked_entity_type: string | null
  linked_entity_id: string | null
  is_active: boolean
  created_at: Date
}
