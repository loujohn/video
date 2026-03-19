import { describe, it, expect } from 'vitest'

const VALID_STATUSES = ['open', 'resolved']

function validateCommentUpdate(body: Record<string, unknown>) {
  const updateData: Record<string, unknown> = {}
  if (body.content !== undefined) updateData.content = String(body.content)
  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status as string)) {
      throw new Error('status 必须为 open 或 resolved')
    }
    updateData.status = body.status
  }
  return updateData
}

describe('comment update validation', () => {
  it('accepts valid status "open"', () => {
    const result = validateCommentUpdate({ status: 'open' })
    expect(result.status).toBe('open')
  })

  it('accepts valid status "resolved"', () => {
    const result = validateCommentUpdate({ status: 'resolved' })
    expect(result.status).toBe('resolved')
  })

  it('rejects invalid status', () => {
    expect(() => validateCommentUpdate({ status: 'hacked' }))
      .toThrow('status 必须为 open 或 resolved')
  })

  it('accepts content update', () => {
    const result = validateCommentUpdate({ content: 'new text' })
    expect(result.content).toBe('new text')
  })

  it('coerces content to string', () => {
    const result = validateCommentUpdate({ content: 123 })
    expect(result.content).toBe('123')
  })

  it('returns empty object when no fields provided', () => {
    const result = validateCommentUpdate({})
    expect(result).toEqual({})
  })

  it('handles both content and status', () => {
    const result = validateCommentUpdate({ content: 'fix', status: 'resolved' })
    expect(result).toEqual({ content: 'fix', status: 'resolved' })
  })
})
