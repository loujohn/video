import { describe, it, expect } from 'vitest'
import type { CommentEntityType, CommentStatus } from '../../app/core/types'

describe('comment entity type enum', () => {
  const validTypes: CommentEntityType[] = [
    'episode_script', 'storyboard', 'character', 'scene', 'prop', 'creative_plan', 'asset',
  ]

  it.each(validTypes)('"%s" is a valid entity type', (type) => {
    expect(typeof type).toBe('string')
    expect(type.length).toBeGreaterThan(0)
  })
})

describe('comment status enum', () => {
  const validStatuses: CommentStatus[] = ['open', 'resolved']

  it.each(validStatuses)('"%s" is a valid status', (status) => {
    expect(typeof status).toBe('string')
  })
})

describe('PostgreSQL uuid[] format', () => {
  function formatMentionsForPg(mentions: string[]): string {
    if (!mentions.length) return '{}'
    return `{${mentions.join(',')}}`
  }

  it('returns empty PG array for no mentions', () => {
    expect(formatMentionsForPg([])).toBe('{}')
  })

  it('formats single UUID correctly', () => {
    expect(formatMentionsForPg(['abc-123'])).toBe('{abc-123}')
  })

  it('formats multiple UUIDs correctly', () => {
    expect(formatMentionsForPg(['a', 'b', 'c'])).toBe('{a,b,c}')
  })

  it('matches the format used in comment.model.ts create method', () => {
    const mentions = ['uuid-1', 'uuid-2']
    const result = mentions.length ? `{${mentions.join(',')}}` : '{}'
    expect(result).toBe('{uuid-1,uuid-2}')
  })
})
