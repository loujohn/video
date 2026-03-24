import { streamText, stepCountIs } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { loadSkill } from './SkillLoader'
import { registerTools, getCreativeToolDefs } from './ToolRegistry'
import { executeToolCall } from './ToolExecutor'

interface AgentConfig {
  provider: string
  model: string
  apiKey: string
  baseUrl?: string
  temperature: number
  maxTokens: number
}

interface ChatInput {
  message: string
  projectId?: string | null
  skillId: string
  history: Array<{ role: 'user' | 'assistant'; content: string }>
}

function createModel(config: AgentConfig) {
  if (config.provider === 'anthropic') {
    const anthropic = createAnthropic({ apiKey: config.apiKey })
    return anthropic(config.model)
  }

  const openai = createOpenAI({
    apiKey: config.apiKey,
    ...(config.baseUrl ? { baseURL: config.baseUrl } : {}),
  })
  return openai(config.model)
}

export async function runAgentChat(config: AgentConfig, input: ChatInput) {
  const skill = await loadSkill(input.skillId)

  const systemParts: string[] = [skill.systemPrompt]

  if (input.projectId) {
    systemParts.push(`\n\n---\n\n当前项目 ID: ${input.projectId}\n请在调用需要 project_id 的工具时使用此 ID。`)
  }

  systemParts.push(
    '\n\n---\n\n'
    + '重要行为准则：\n'
    + '1. 你是一个自主执行的 AI Agent，收到任务后应连续调用多个工具直到完成，不需要每步都等待用户确认。\n'
    + '2. 完成一个阶段的全部操作后，将结果汇总报告给用户。\n'
    + '3. 如果遇到错误，尝试自行修复；多次失败后再告知用户。\n'
    + '4. 调用工具时，参数需完整准确。\n'
    + '5. 所有创作内容必须是中文（除非用户切换到出海模式）。\n',
  )

  const toolDefs = getCreativeToolDefs()
  const tools = registerTools(toolDefs, executeToolCall, skill.tools)
  const model = createModel(config)

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...input.history,
    { role: 'user' as const, content: input.message },
  ]

  return streamText({
    model,
    system: systemParts.join(''),
    messages,
    tools,
    stopWhen: stepCountIs(20),
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    onError({ error }) {
      console.error('[AgentService] Stream error:', error)
    },
  })
}
