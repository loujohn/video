export type CommentEntityType = 'episode_script' | 'storyboard' | 'character' | 'scene' | 'prop' | 'creative_plan'
export type CommentStatus = 'open' | 'resolved'

export interface Comment {
  id: string
  project_id: string
  entity_type: CommentEntityType
  entity_id: string
  parent_id: string | null
  content: string
  mentions: string[]
  status: CommentStatus
  created_by: string
  created_at: Date
  updated_at: Date
}

export interface CommentWithAuthor extends Comment {
  author_name: string
  author_email: string
  replies?: CommentWithAuthor[]
}

export interface CreateCommentInput {
  entity_type: CommentEntityType
  entity_id: string
  content: string
  parent_id?: string
  mentions?: string[]
}

export interface UpdateCommentInput {
  content?: string
  status?: CommentStatus
}
