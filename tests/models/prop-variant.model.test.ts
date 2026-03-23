import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockDb = {
  where: vi.fn().mockReturnThis(),
  whereIn: vi.fn().mockReturnThis(),
  andWhereRaw: vi.fn().mockReturnThis(),
  select: vi.fn().mockResolvedValue([]),
  distinctOn: vi.fn().mockReturnThis(),
  orderByRaw: vi.fn().mockReturnThis(),
  first: vi.fn(),
  orderBy: vi.fn().mockReturnThis(),
  max: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  returning: vi.fn(),
  del: vi.fn(),
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

describe('PropVariantModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.where.mockReturnValue(mockDb)
    mockDb.whereIn.mockReturnValue(mockDb)
    mockDb.andWhereRaw.mockReturnValue(mockDb)
    mockDb.select.mockResolvedValue([])
    mockDb.distinctOn.mockReturnValue(mockDb)
    mockDb.orderByRaw.mockReturnValue(mockDb)
    mockDb.orderBy.mockReturnValue(mockDb)
    mockDb.max.mockReturnValue(mockDb)
    mockDb.insert.mockReturnValue(mockDb)
    mockDb.update.mockReturnValue(mockDb)
  })

  it('module exports expected methods', async () => {
    const { PropVariantModel } = await import('../../app/core/models/prop-variant.model')
    expect(PropVariantModel.findById).toBeTypeOf('function')
    expect(PropVariantModel.findByProp).toBeTypeOf('function')
    expect(PropVariantModel.create).toBeTypeOf('function')
    expect(PropVariantModel.update).toBeTypeOf('function')
    expect(PropVariantModel.delete).toBeTypeOf('function')
  })

  it('findById queries by id', async () => {
    mockDb.first.mockResolvedValue({ id: 'v1', name: 'test' })
    const { PropVariantModel } = await import('../../app/core/models/prop-variant.model')
    const result = await PropVariantModel.findById('v1')
    expect(result).toEqual({ id: 'v1', name: 'test' })
  })

  it('findByProp filters by prop_id and is_active', async () => {
    mockDb.orderBy.mockResolvedValue([{ id: 'v1' }])
    const { PropVariantModel } = await import('../../app/core/models/prop-variant.model')
    await PropVariantModel.findByProp('p1')
    expect(mockDb.where).toHaveBeenCalledWith({ prop_id: 'p1', is_active: true })
  })
})
