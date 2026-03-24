import { getDb } from '~/core/db'
import { encrypt, decrypt, maskApiKey } from '~~/server/utils/encryption'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { provider, model, api_key, base_url, temperature, max_tokens } = body || {}

  if (!provider || !model) {
    throw createError({ statusCode: 400, message: 'provider and model are required' })
  }

  const db = getDb()
  const existing = await db('agent_settings').first()

  const data: Record<string, unknown> = {
    provider,
    model,
    base_url: base_url || null,
    temperature: temperature ?? 0.7,
    max_tokens: max_tokens ?? 4096,
    updated_at: db.fn.now(),
  }

  if (api_key && api_key.length > 0) {
    data.api_key_encrypted = encrypt(api_key)
  }

  if (existing) {
    await db('agent_settings').where({ id: existing.id }).update(data)
  }
  else {
    data.created_at = db.fn.now()
    await db('agent_settings').insert(data)
  }

  const row = await db('agent_settings').first()
  let maskedKey = ''
  if (row?.api_key_encrypted) {
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
