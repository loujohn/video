import { getDb } from '~/core/db'
import { decrypt } from '~~/server/utils/encryption'
import { runAgentChat } from '~~/server/services/agent/AgentService'
import { setAuthToken } from '~~/server/services/agent/ToolExecutor'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { message, project_id, skill_id, history, conversation_id } = body || {}

  if (!message || typeof message !== 'string') {
    throw createError({ statusCode: 400, message: 'message is required' })
  }

  const db = getDb()
  const userId = event.context.userId
  const settings = userId
    ? (await db('agent_settings').where({ user_id: userId }).first())
      || (await db('agent_settings').whereNull('user_id').first())
    : await db('agent_settings').first()

  if (!settings || !settings.api_key_encrypted) {
    throw createError({ statusCode: 400, message: 'AI 设置未配置，请先在设置中配置 API Key' })
  }

  let apiKey: string
  try {
    apiKey = decrypt(settings.api_key_encrypted)
  }
  catch {
    throw createError({ statusCode: 500, message: 'API Key 解密失败' })
  }

  const config = {
    provider: settings.provider,
    model: settings.model,
    apiKey,
    baseUrl: settings.base_url || undefined,
    temperature: Number(settings.temperature) || 0.7,
    maxTokens: settings.max_tokens || 4096,
  }

  const authHeader = getRequestHeader(event, 'authorization')
  const userToken = authHeader?.replace('Bearer ', '')
  setAuthToken(userToken)

  let convId = conversation_id
  if (!convId && userId) {
    const titlePreview = message.slice(0, 50) + (message.length > 50 ? '...' : '')
    const [conv] = await db('agent_conversations')
      .insert({
        user_id: userId,
        title: titlePreview,
        project_id: project_id || null,
        skill_id: skill_id || 'drama-writer',
      })
      .returning('id')
    convId = conv.id || conv
  }

  if (convId && userId) {
    const maxOrder = await db('agent_messages')
      .where({ conversation_id: convId })
      .max('sort_order as max')
      .first()
    await db('agent_messages').insert({
      conversation_id: convId,
      role: 'user',
      content: message,
      sort_order: (maxOrder?.max ?? -1) + 1,
    })
  }

  const result = await runAgentChat(config, {
    message,
    projectId: project_id || null,
    skillId: skill_id || 'drama-writer',
    history: history || [],
  })

  const res = event.node.res
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Content-Type-Options': 'nosniff',
  })

  function send(type: string, data: unknown) {
    res.write(`data: ${JSON.stringify({ type, ...data as object })}\n\n`)
  }

  if (convId) {
    send('conversation', { conversationId: convId })
  }

  let fullText = ''
  const toolCalls: Array<{ id: string; name: string; args: unknown; result?: string }> = []

  for await (const part of result.fullStream) {
    switch (part.type) {
      case 'text-delta':
        fullText += part.textDelta
        send('text', { text: part.textDelta })
        break
      case 'tool-call':
        toolCalls.push({ id: part.toolCallId, name: part.toolName, args: part.args })
        send('tool-call', {
          toolCallId: part.toolCallId,
          toolName: part.toolName,
          args: part.args,
        })
        break
      case 'tool-result': {
        const tc = toolCalls.find(t => t.id === part.toolCallId)
        if (tc) {
          tc.result = typeof part.result === 'string'
            ? part.result.slice(0, 2000)
            : JSON.stringify(part.result).slice(0, 2000)
        }
        send('tool-result', {
          toolCallId: part.toolCallId,
          toolName: part.toolName,
          result: tc?.result,
        })
        break
      }
      case 'error': {
        const msg = part.error instanceof Error ? part.error.message : String(part.error)
        const isAuthError = msg.includes('Incorrect API key') || msg.includes('401') || msg.includes('authentication')
        send('error', {
          message: isAuthError
            ? 'API Key 无效，请在设置中重新配置。'
            : `AI 服务调用失败: ${msg}`,
        })
        break
      }
      case 'step-finish':
        send('step-finish', { finishReason: part.finishReason })
        break
    }
  }

  if (convId && userId && fullText) {
    const maxOrder = await db('agent_messages')
      .where({ conversation_id: convId })
      .max('sort_order as max')
      .first()
    await db('agent_messages').insert({
      conversation_id: convId,
      role: 'assistant',
      content: fullText,
      tool_calls: toolCalls.length > 0 ? JSON.stringify(toolCalls) : null,
      sort_order: (maxOrder?.max ?? -1) + 1,
    })
    await db('agent_conversations').where({ id: convId }).update({ updated_at: db.fn.now() })
  }

  send('done', {})
  res.end()
})
