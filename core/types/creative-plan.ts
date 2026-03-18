export interface CreativePlan {
  id: string
  project_id: string
  content: Record<string, unknown>
  version: number
  created_at: Date
  updated_at: Date
}

export interface UpdateCreativePlanInput {
  content: Record<string, unknown>
  change_summary?: string
}
