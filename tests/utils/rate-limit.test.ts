import { describe, it, expect, beforeEach, vi } from 'vitest'

const store = new Map<string, { count: number; resetAt: number }>()

function createMockEvent(ip = '127.0.0.1') {
  const responseHeaders: Record<string, string> = {}
  return {
    ip,
    headers: new Map<string, string>([['x-forwarded-for', ip]]),
    responseHeaders,
    getHeader(name: string) {
      return this.headers.get(name.toLowerCase())
    },
    setResponseHeader(name: string, value: string) {
      this.responseHeaders[name] = value
    },
  }
}

function checkRateLimitPure(
  event: ReturnType<typeof createMockEvent>,
  opts: { windowMs?: number; max?: number; keyPrefix?: string } = {},
) {
  const { windowMs = 60_000, max = 10, keyPrefix = 'rl' } = opts
  const ip = event.getHeader('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1'
  const key = `${keyPrefix}:${ip}`
  const now = Date.now()

  let entry = store.get(key)
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowMs }
    store.set(key, entry)
  }
  entry.count++

  event.setResponseHeader('X-RateLimit-Limit', max.toString())
  event.setResponseHeader('X-RateLimit-Remaining', Math.max(0, max - entry.count).toString())
  event.setResponseHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000).toString())

  if (entry.count > max) {
    throw { statusCode: 429, statusMessage: '请求过于频繁，请稍后再试' }
  }
}

describe('rate-limit', () => {
  beforeEach(() => {
    store.clear()
  })

  it('allows requests within the limit', () => {
    const event = createMockEvent()
    expect(() => checkRateLimitPure(event, { max: 5 })).not.toThrow()
    expect(event.responseHeaders['X-RateLimit-Limit']).toBe('5')
    expect(event.responseHeaders['X-RateLimit-Remaining']).toBe('4')
  })

  it('decrements remaining count with each request', () => {
    const event1 = createMockEvent()
    checkRateLimitPure(event1, { max: 3 })
    expect(event1.responseHeaders['X-RateLimit-Remaining']).toBe('2')

    const event2 = createMockEvent()
    checkRateLimitPure(event2, { max: 3 })
    expect(event2.responseHeaders['X-RateLimit-Remaining']).toBe('1')

    const event3 = createMockEvent()
    checkRateLimitPure(event3, { max: 3 })
    expect(event3.responseHeaders['X-RateLimit-Remaining']).toBe('0')
  })

  it('throws 429 when limit is exceeded', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimitPure(createMockEvent(), { max: 3 })
    }
    expect(() => checkRateLimitPure(createMockEvent(), { max: 3 })).toThrow()
    try {
      checkRateLimitPure(createMockEvent(), { max: 3 })
    } catch (e: any) {
      expect(e.statusCode).toBe(429)
      expect(e.statusMessage).toBe('请求过于频繁，请稍后再试')
    }
  })

  it('tracks different IPs independently', () => {
    for (let i = 0; i < 2; i++) {
      checkRateLimitPure(createMockEvent('1.1.1.1'), { max: 2 })
    }
    expect(() => checkRateLimitPure(createMockEvent('1.1.1.1'), { max: 2 })).toThrow()
    expect(() => checkRateLimitPure(createMockEvent('2.2.2.2'), { max: 2 })).not.toThrow()
  })

  it('uses keyPrefix to separate different limits', () => {
    for (let i = 0; i < 2; i++) {
      checkRateLimitPure(createMockEvent(), { max: 2, keyPrefix: 'login' })
    }
    expect(() => checkRateLimitPure(createMockEvent(), { max: 2, keyPrefix: 'login' })).toThrow()
    expect(() => checkRateLimitPure(createMockEvent(), { max: 2, keyPrefix: 'register' })).not.toThrow()
  })

  it('resets after window expires', () => {
    vi.useFakeTimers()
    try {
      for (let i = 0; i < 3; i++) {
        checkRateLimitPure(createMockEvent(), { max: 3, windowMs: 1000 })
      }
      expect(() => checkRateLimitPure(createMockEvent(), { max: 3, windowMs: 1000 })).toThrow()

      vi.advanceTimersByTime(1100)

      expect(() => checkRateLimitPure(createMockEvent(), { max: 3, windowMs: 1000 })).not.toThrow()
    } finally {
      vi.useRealTimers()
    }
  })

  it('sets X-RateLimit-Remaining to 0 (not negative) when exceeded', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimitPure(createMockEvent(), { max: 3 })
    }
    const event = createMockEvent()
    try {
      checkRateLimitPure(event, { max: 3 })
    } catch {}
    expect(event.responseHeaders['X-RateLimit-Remaining']).toBe('0')
  })
})
