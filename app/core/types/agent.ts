export interface AgentSettings {
  id: string
  provider: 'openai' | 'anthropic' | 'custom'
  model: string
  has_api_key: boolean
  base_url?: string
  temperature: number
  max_tokens: number
  created_at: string
  updated_at: string
}

export interface AgentSettingsInput {
  provider: 'openai' | 'anthropic' | 'custom'
  model: string
  api_key?: string
  base_url?: string
  temperature: number
  max_tokens: number
}

export interface SkillMeta {
  id: string
  name: string
  description: string
  icon: string
  tools: string[] | '*'
}

export interface AgentChatRequest {
  message: string
  project_id?: string | null
  skill_id?: string
  history?: AgentHistoryMessage[]
}

export interface AgentHistoryMessage {
  role: 'user' | 'assistant'
  content: string
  tool_calls?: AgentToolCallInfo[]
}

export interface AgentToolCallInfo {
  id: string
  name: string
  arguments: Record<string, unknown>
  result?: string
  status: 'running' | 'done' | 'error'
}

export interface AgentResultCard {
  title: string
  icon: string
  body: string
  entity_type?: string
  entity_id?: string
}
