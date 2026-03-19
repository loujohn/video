export type EpisodeStatus = 'planned' | 'writing' | 'written'

export interface Episode {
  id: string
  project_id: string
  episode_number: number
  title: string | null
  synopsis: string | null
  hook_type: string | null
  is_key_episode: boolean
  is_paywall: boolean
  act: number | null
  rhythm_phase: string | null
  status: EpisodeStatus
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface EpisodeScript {
  id: string
  episode_id: string
  content: string | null
  version: number
  word_count: number
  created_by: string | null
  created_at: Date
}

export interface CreateEpisodeInput {
  episode_number: number
  title?: string
  synopsis?: string
  hook_type?: string
  is_key_episode?: boolean
  is_paywall?: boolean
  act?: number | null
  rhythm_phase?: string
}
