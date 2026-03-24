import { getDb } from '~/core/db'
import { maskApiKey, decrypt } from '~~/server/utils/encryption'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const db = getDb()

  const row = userId
    ? await db('agent_settings').where({ user_id: userId }).first()
      || await db('agent_settings').whereNull('user_id').first()
    : await db('agent_settings').first()

  if (!row) {
    return {
      success: true,
      data: {
        provider: 'openai',
        model: 'gpt-4o',
        has_api_key: false,
        masked_api_key: '',
        base_url: '',
        temperature: 0.7,
        max_tokens: 4096,
      },
    }
  }

  let maskedKey = ''
  if (row.api_key_encrypted) {
    try {
      maskedKey = maskApiKey(decrypt(row.api_key_encrypted))
    }
    catch {
      maskedKey = '(解密失败)'
    }
  }

  return {
    success: true,
    data: {
      provider: row.provider,
      model: row.model,
      has_api_key: !!row.api_key_encrypted,
      masked_api_key: maskedKey,
      base_url: row.base_url || '',
      temperature: Number(row.temperature),
      max_tokens: row.max_tokens,
    },
  }
})
