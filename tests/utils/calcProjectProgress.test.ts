import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockDb: any = {
  where: vi.fn(),
  whereIn: vi.fn(),
  join: vi.fn(),
  select: vi.fn(),
  count: vi.fn(),
  first: vi.fn(),
  raw: vi.fn((str: string) => str),
  andWhere: vi.fn(),
  andWhereRaw: vi.fn(),
}

for (const key of ['where', 'whereIn', 'join', 'select', 'count', 'andWhere', 'andWhereRaw']) {
  mockDb[key].mockReturnValue(mockDb)
}

vi.mock('../../app/core/db', () => ({
  getDb: () => {
    const fn = (_table: string) => mockDb
    fn.raw = mockDb.raw
    return fn
  },
}))

describe('calcProjectProgress', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    for (const key of ['where', 'whereIn', 'join', 'select', 'count', 'andWhere', 'andWhereRaw']) {
      mockDb[key].mockReturnValue(mockDb)
    }
  })

  it('returns zero progress for empty project', async () => {
    mockDb.first
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ total: 0, wl: 0 })
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ created: 0, written: 0, writing: 0 })
      .mockResolvedValueOnce({ total: 0, wip: 0, wvp: 0 })
      .mockResolvedValueOnce({ wi: 0, approved: 0 })

    const { calcProjectProgress } = await import('../../server/utils/calcProjectProgress')
    const result = await calcProjectProgress('proj-1', 10)

    expect(result.overall_percent).toBe(0)
    expect(result.creative_plan).toBe(false)
    expect(result.characters.total).toBe(0)
    expect(result.episodes.total).toBe(10)
    expect(result.episodes.created).toBe(0)
    expect(result.images.with_images).toBe(0)
  })

  it('calculates full progress for complete project', async () => {
    mockDb.first
      .mockResolvedValueOnce({ id: 'plan-1' })
      .mockResolvedValueOnce({ total: 5, wl: 5 })
      .mockResolvedValueOnce({ count: 8 })
      .mockResolvedValueOnce({ created: 10, written: 10, writing: 0 })
      .mockResolvedValueOnce({ total: 60, wip: 60, wvp: 60 })
      .mockResolvedValueOnce({ wi: 60, approved: 60 })

    const { calcProjectProgress } = await import('../../server/utils/calcProjectProgress')
    const result = await calcProjectProgress('proj-1', 10)

    expect(result.overall_percent).toBe(100)
    expect(result.creative_plan).toBe(true)
    expect(result.characters.with_looks).toBe(5)
    expect(result.episodes.written).toBe(10)
    expect(result.images.approved).toBe(60)
  })

  it('handles partial progress correctly', async () => {
    mockDb.first
      .mockResolvedValueOnce({ id: 'plan-1' })
      .mockResolvedValueOnce({ total: 4, wl: 2 })
      .mockResolvedValueOnce({ count: 3 })
      .mockResolvedValueOnce({ created: 5, written: 3, writing: 2 })
      .mockResolvedValueOnce({ total: 20, wip: 10, wvp: 5 })
      .mockResolvedValueOnce({ wi: 8, approved: 2 })

    const { calcProjectProgress } = await import('../../server/utils/calcProjectProgress')
    const result = await calcProjectProgress('proj-1', 8)

    expect(result.creative_plan).toBe(true)
    expect(result.characters).toEqual({ total: 4, with_looks: 2 })
    expect(result.episodes).toEqual({ total: 8, created: 5, written: 3, writing: 2 })
    expect(result.storyboards).toEqual({ total: 20, with_image_prompt: 10, with_video_prompt: 5 })
    expect(result.images).toEqual({ total_storyboards: 20, with_images: 8, approved: 2 })
    expect(result.overall_percent).toBeGreaterThan(0)
    expect(result.overall_percent).toBeLessThan(100)
  })

  it('caps overall_percent at 100', async () => {
    mockDb.first
      .mockResolvedValueOnce({ id: 'plan-1' })
      .mockResolvedValueOnce({ total: 10, wl: 10 })
      .mockResolvedValueOnce({ count: 20 })
      .mockResolvedValueOnce({ created: 8, written: 8, writing: 0 })
      .mockResolvedValueOnce({ total: 100, wip: 100, wvp: 100 })
      .mockResolvedValueOnce({ wi: 100, approved: 100 })

    const { calcProjectProgress } = await import('../../server/utils/calcProjectProgress')
    const result = await calcProjectProgress('proj-1', 8)

    expect(result.overall_percent).toBeLessThanOrEqual(100)
  })
})
