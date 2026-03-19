import type { H3Event } from 'h3'

export interface PaginationParams {
  page: number
  pageSize: number
  offset: number
}

export function parsePagination(event: H3Event, defaults = { page: 1, pageSize: 20 }): PaginationParams {
  const query = getQuery(event)
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
