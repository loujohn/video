import { getDb } from '~/core/db'
import { decrypt } from '~~/server/utils/encryption'
import { runAgentChat } from '~~/server/services/agent/AgentService'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { message, project_id, skill_id, history } = body || {}

  if (!message || typeof message !== 'string') {
    throw createError({ statusCode: 400, message: 'message is required' })
  }

  const db = getDb()
  const settings = await db('agent_settings').first()

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

  const result = await runAgentChat(config, {
    message,
    projectId: project_id || null,
    skillId: skill_id || 'drama-writer',
    history: history || [],
  })

  const res = event.node.res
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  })

  for await (const part of result.fullStream) {
    switch (part.type) {
      case 'text-delta':
        res.write(part.textDelta)
        break
      case 'error': {
        const msg = part.error instanceof Error ? part.error.message : String(part.error)
        const isAuthError = msg.includes('Incorrect API key') || msg.includes('401') || msg.includes('authentication')
        const errorText = isAuthError
          ? '\n\n[错误] API Key 无效，请在设置中重新配置。'
          : `\n\n[错误] AI 服务调用失败: ${msg}`
        res.write(errorText)
        break
      }
    }
  }

  res.end()
})
