import { describe, it, expect } from 'vitest'

describe('notification query parsing', () => {
  function parseNotificationQuery(query: Record<string, string | undefined>) {
    const options: { isRead?: boolean; limit?: number; offset?: number } = {}
    if (query.is_read === 'true') options.isRead = true
    else if (query.is_read === 'false') options.isRead = false
    if (query.limit !== undefined && query.limit !== '') options.limit = Math.min(Math.max(Number(query.limit), 0), 50)
    if (query.offset) options.offset = Number(query.offset)
    return options
  }

  it('parses is_read=true correctly', () => {
    expect(parseNotificationQuery({ is_read: 'true' })).toEqual({ isRead: true })
  })

  it('parses is_read=false correctly', () => {
    expect(parseNotificationQuery({ is_read: 'false' })).toEqual({ isRead: false })
  })

  it('omits isRead when is_read not provided', () => {
    expect(parseNotificationQuery({})).toEqual({})
  })

  it('parses limit correctly', () => {
    expect(parseNotificationQuery({ limit: '10' })).toEqual({ limit: 10 })
  })

  it('caps limit at 50', () => {
    expect(parseNotificationQuery({ limit: '100' })).toEqual({ limit: 50 })
  })

  it('handles limit=0 correctly (does not skip)', () => {
    const result = parseNotificationQuery({ limit: '0' })
    expect(result.limit).toBe(0)
  })

  it('parses offset correctly', () => {
    expect(parseNotificationQuery({ offset: '20' })).toEqual({ offset: 20 })
  })

  it('handles combined parameters', () => {
    expect(parseNotificationQuery({ is_read: 'false', limit: '5', offset: '10' }))
      .toEqual({ isRead: false, limit: 5, offset: 10 })
  })
})
