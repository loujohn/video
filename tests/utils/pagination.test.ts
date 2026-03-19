import { describe, it, expect } from 'vitest'

function parsePaginationPure(
  query: Record<string, string | undefined>,
  defaults = { page: 1, pageSize: 20 },
) {
  const rawPage = parseInt(query.page as string)
  const rawPageSize = parseInt(query.pageSize as string)
  const page = Math.max(1, Number.isNaN(rawPage) ? defaults.page : rawPage)
  const pageSize = Math.min(100, Math.max(1, Number.isNaN(rawPageSize) ? defaults.pageSize : rawPageSize))
  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
  }
}

describe('parsePagination', () => {
  it('returns defaults when no query params', () => {
    const result = parsePaginationPure({})
    expect(result).toEqual({ page: 1, pageSize: 20, offset: 0 })
  })

  it('parses page and pageSize from query', () => {
    const result = parsePaginationPure({ page: '3', pageSize: '10' })
    expect(result).toEqual({ page: 3, pageSize: 10, offset: 20 })
  })

  it('calculates correct offset', () => {
    expect(parsePaginationPure({ page: '1', pageSize: '10' }).offset).toBe(0)
    expect(parsePaginationPure({ page: '2', pageSize: '10' }).offset).toBe(10)
    expect(parsePaginationPure({ page: '5', pageSize: '25' }).offset).toBe(100)
  })

  it('enforces minimum page of 1', () => {
    expect(parsePaginationPure({ page: '0' }).page).toBe(1)
    expect(parsePaginationPure({ page: '-5' }).page).toBe(1)
  })

  it('enforces minimum pageSize of 1', () => {
    expect(parsePaginationPure({ pageSize: '0' }).pageSize).toBe(1)
    expect(parsePaginationPure({ pageSize: '-10' }).pageSize).toBe(1)
  })

  it('enforces maximum pageSize of 100', () => {
    expect(parsePaginationPure({ pageSize: '200' }).pageSize).toBe(100)
    expect(parsePaginationPure({ pageSize: '1000' }).pageSize).toBe(100)
  })

  it('handles non-numeric values gracefully', () => {
    const result = parsePaginationPure({ page: 'abc', pageSize: 'xyz' })
    expect(result).toEqual({ page: 1, pageSize: 20, offset: 0 })
  })

  it('handles undefined values', () => {
    const result = parsePaginationPure({ page: undefined, pageSize: undefined })
    expect(result).toEqual({ page: 1, pageSize: 20, offset: 0 })
  })
})
