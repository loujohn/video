import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockDb: Record<string, ReturnType<typeof vi.fn>> = {
  leftJoin: vi.fn(),
  where: vi.fn(),
  select: vi.fn(),
  first: vi.fn(),
  orderBy: vi.fn(),
  max: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  returning: vi.fn(),
  del: vi.fn(),
}

function chainAll() {
  for (const key of Object.keys(mockDb)) {
    mockDb[key].mockReturnValue(mockDb)
  }
}

const mockGetDb = vi.fn(() => vi.fn(() => mockDb))

vi.mock('../../app/core/db', () => ({
  getDb: () => mockGetDb(),
  buildUpdateData: vi.fn((data, fields) => {
    const result: Record<string, unknown> = { updated_at: new Date() }
    for (const f of fields) {
      if (data[f] !== undefined) result[f] = data[f]
    }
    return result
  }),
}))

describe('StoryboardModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chainAll()
  })

  it('exports expected methods', async () => {
    const { StoryboardModel } = await import('../../app/core/models/storyboard.model')
    expect(StoryboardModel.findById).toBeTypeOf('function')
    expect(StoryboardModel.findByEpisode).toBeTypeOf('function')
    expect(StoryboardModel.create).toBeTypeOf('function')
    expect(StoryboardModel.update).toBeTypeOf('function')
    expect(StoryboardModel.delete).toBeTypeOf('function')
    expect(StoryboardModel.reorder).toBeTypeOf('function')
  })

  it('findById queries with left join on users', async () => {
    const mockRow = { id: 'sb-1', description: 'test', assigned_to_name: 'John' }
    mockDb.first.mockResolvedValue(mockRow)
    const { StoryboardModel } = await import('../../app/core/models/storyboard.model')
    const result = await StoryboardModel.findById('sb-1')
    expect(result).toEqual(mockRow)
    expect(mockDb.leftJoin).toHaveBeenCalled()
  })

  it('findByEpisode filters by episode_id and is_active', async () => {
    mockDb.select.mockResolvedValue([{ id: 'sb-1' }, { id: 'sb-2' }])
    const { StoryboardModel } = await import('../../app/core/models/storyboard.model')
    const results = await StoryboardModel.findByEpisode('ep-1')
    expect(results).toHaveLength(2)
    expect(mockDb.where).toHaveBeenCalled()
    expect(mockDb.orderBy).toHaveBeenCalled()
  })

  it('create includes video_prompt in insert data', async () => {
    const newRow = {
      id: 'sb-new',
      episode_id: 'ep-1',
      sequence_number: 1,
      video_prompt: '{"positive":"test","duration":5}',
    }
    mockDb.first.mockResolvedValue({ max: 0 })
    mockDb.returning.mockResolvedValue([newRow])
    const { StoryboardModel } = await import('../../app/core/models/storyboard.model')
    const result = await StoryboardModel.create('ep-1', {
      description: 'test storyboard',
      video_prompt: '{"positive":"test","duration":5}',
    })
    expect(result).toEqual(newRow)
    expect(mockDb.insert).toHaveBeenCalledWith(
      expect.objectContaining({ video_prompt: '{"positive":"test","duration":5}' }),
    )
  })

  it('create defaults video_prompt to null when not provided', async () => {
    const newRow = { id: 'sb-new', episode_id: 'ep-1', video_prompt: null }
    mockDb.first.mockResolvedValue({ max: 0 })
    mockDb.returning.mockResolvedValue([newRow])
    const { StoryboardModel } = await import('../../app/core/models/storyboard.model')
    await StoryboardModel.create('ep-1', { description: 'no video prompt' })
    expect(mockDb.insert).toHaveBeenCalledWith(
      expect.objectContaining({ video_prompt: null }),
    )
  })

  it('create auto-increments sequence_number', async () => {
    mockDb.first.mockResolvedValue({ max: 5 })
    mockDb.returning.mockResolvedValue([{ id: 'sb-new', sequence_number: 6 }])
    const { StoryboardModel } = await import('../../app/core/models/storyboard.model')
    await StoryboardModel.create('ep-1', {})
    expect(mockDb.insert).toHaveBeenCalledWith(
      expect.objectContaining({ sequence_number: 6 }),
    )
  })

  it('create uses provided sequence_number when given', async () => {
    mockDb.returning.mockResolvedValue([{ id: 'sb-new', sequence_number: 10 }])
    const { StoryboardModel } = await import('../../app/core/models/storyboard.model')
    await StoryboardModel.create('ep-1', { sequence_number: 10 })
    expect(mockDb.insert).toHaveBeenCalledWith(
      expect.objectContaining({ sequence_number: 10 }),
    )
  })

  it('update passes video_prompt through buildUpdateData', async () => {
    const updatedRow = { id: 'sb-1', video_prompt: '{"positive":"updated"}' }
    mockDb.returning.mockResolvedValue([updatedRow])
    const { StoryboardModel } = await import('../../app/core/models/storyboard.model')
    const result = await StoryboardModel.update('sb-1', {
      video_prompt: '{"positive":"updated"}',
    })
    expect(result).toEqual(updatedRow)
    expect(mockDb.where).toHaveBeenCalledWith({ id: 'sb-1' })
  })

  it('update handles image_prompt and video_prompt together', async () => {
    const updatedRow = {
      id: 'sb-1',
      image_prompt: 'cinematic close-up',
      video_prompt: '{"positive":"video test"}',
    }
    mockDb.returning.mockResolvedValue([updatedRow])
    const { StoryboardModel } = await import('../../app/core/models/storyboard.model')
    const result = await StoryboardModel.update('sb-1', {
      image_prompt: 'cinematic close-up',
      video_prompt: '{"positive":"video test"}',
    })
    expect(result).toEqual(updatedRow)
  })

  it('delete returns true when row is deleted', async () => {
    mockDb.del.mockResolvedValue(1)
    const { StoryboardModel } = await import('../../app/core/models/storyboard.model')
    const result = await StoryboardModel.delete('sb-1')
    expect(result).toBe(true)
  })

  it('delete returns false when no row found', async () => {
    mockDb.del.mockResolvedValue(0)
    const { StoryboardModel } = await import('../../app/core/models/storyboard.model')
    const result = await StoryboardModel.delete('sb-nonexistent')
    expect(result).toBe(false)
  })
})
