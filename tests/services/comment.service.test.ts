import { describe, it, expect } from 'vitest'
import { buildCommentTree, truncate } from '../../app/core/services/comment.service'
import type { CommentWithAuthor } from '../../app/core/types'

function makeComment(overrides: Partial<CommentWithAuthor> = {}): CommentWithAuthor {
  return {
    id: 'c1',
    project_id: 'p1',
    entity_type: 'storyboard',
    entity_id: 'e1',
    parent_id: null,
    content: 'test',
    mentions: [],
    status: 'open',
    created_by: 'u1',
    created_at: new Date(),
    updated_at: new Date(),
    author_name: 'User',
    author_email: 'user@test.com',
    ...overrides,
  }
}

describe('buildCommentTree', () => {
  it('returns empty array for empty input', () => {
    expect(buildCommentTree([])).toEqual([])
  })

  it('returns top-level comments as roots', () => {
    const c1 = makeComment({ id: 'c1' })
    const c2 = makeComment({ id: 'c2' })
    const result = buildCommentTree([c1, c2])
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('c1')
    expect(result[1].id).toBe('c2')
  })

  it('nests replies under parent comments', () => {
    const parent = makeComment({ id: 'p1' })
    const reply = makeComment({ id: 'r1', parent_id: 'p1' })
    const result = buildCommentTree([parent, reply])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('p1')
    expect(result[0].replies).toHaveLength(1)
    expect(result[0].replies![0].id).toBe('r1')
  })

  it('handles multiple replies to same parent', () => {
    const parent = makeComment({ id: 'p1' })
    const r1 = makeComment({ id: 'r1', parent_id: 'p1' })
    const r2 = makeComment({ id: 'r2', parent_id: 'p1' })
    const result = buildCommentTree([parent, r1, r2])
    expect(result).toHaveLength(1)
    expect(result[0].replies).toHaveLength(2)
  })

  it('treats orphaned replies as roots', () => {
    const orphan = makeComment({ id: 'o1', parent_id: 'missing' })
    const result = buildCommentTree([orphan])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('o1')
  })

  it('initializes empty replies array on all comments', () => {
    const c1 = makeComment({ id: 'c1' })
    const result = buildCommentTree([c1])
    expect(result[0].replies).toEqual([])
  })
})

describe('truncate', () => {
  it('returns original text if shorter than maxLen', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('returns original text if exactly maxLen', () => {
    expect(truncate('12345', 5)).toBe('12345')
  })

  it('truncates and adds ellipsis if longer than maxLen', () => {
    expect(truncate('hello world', 5)).toBe('hello…')
  })

  it('handles empty string', () => {
    expect(truncate('', 10)).toBe('')
  })
})
