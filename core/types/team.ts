export interface Team {
  id: string
  name: string
  description: string | null
  created_by: string | null
  created_at: Date
  updated_at: Date
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: 'owner' | 'editor' | 'viewer'
  joined_at: Date
}

export interface CreateTeamInput {
  name: string
  description?: string
}

export interface AddMemberInput {
  user_id: string
  role?: 'editor' | 'viewer'
}

export interface TeamWithMembers extends Team {
  members: (TeamMember & { user_name: string; user_email: string })[]
}
