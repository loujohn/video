export type ProjectStatus = 'draft' | 'in_progress' | 'review' | 'completed'

export interface Project {
  id: string
  team_id: string
  title: string
  genre: string[]
  audience: string | null
  tone: string | null
  ending_type: string | null
  total_episodes: number
  language: string
  mode: string
  status: ProjectStatus
  created_by: string | null
  created_at: Date
  updated_at: Date
}

export interface CreateProjectInput {
  team_id: string
  title: string
  genre?: string[]
  audience?: string
  tone?: string
  ending_type?: string
  total_episodes?: number
  language?: string
  mode?: string
}

export interface UpdateProjectInput {
  title?: string
  genre?: string[]
  audience?: string
  tone?: string
  ending_type?: string
  total_episodes?: number
  language?: string
  mode?: string
  status?: ProjectStatus
}

export interface ProjectProgress {
  overall_percent: number
  creative_plan: boolean
  characters: { total: number; with_looks: number }
  scenes: { total: number }
  episodes: { total: number; created: number; written: number; writing: number }
  storyboards: { total: number; with_image_prompt: number; with_video_prompt: number }
  images: { total_storyboards: number; with_images: number; approved: number }
}

export interface ProjectWithProgress extends Project {
  progress?: ProjectProgress
}
