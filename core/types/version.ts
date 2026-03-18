export interface EntityVersion {
  id: string
  entity_type: string
  entity_id: string
  version_number: number
  snapshot: Record<string, unknown>
  change_summary: string | null
  created_by: string | null
  created_at: Date
}
