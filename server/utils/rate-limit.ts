import type { H3Event } from 'h3'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key)
  }
}, 60_000)

interface RateLimitOptions {
  windowMs?: number
  max?: number
  keyPrefix?: string
}

export function checkRateLimit(event: H3Event, opts: RateLimitOptions = {}): void {
  const { windowMs = 60_000, max = 10, keyPrefix = 'rl' } = opts

  const forwarded = getHeader(event, 'x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || '127.0.0.1'
  const key = `${keyPrefix}:${ip}`

  const now = Date.now()
  let entry = store.get(key)

  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowMs }
    store.set(key, entry)
  }

  entry.count++

  setResponseHeader(event, 'X-RateLimit-Limit', max.toString())
  setResponseHeader(event, 'X-RateLimit-Remaining', Math.max(0, max - entry.count).toString())
  setResponseHeader(event, 'X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000).toString())

  if (entry.count > max) {
    throw createError({
      statusCode: 429,
      message: '请求过于频繁，请稍后再试',
    })
  }
}
