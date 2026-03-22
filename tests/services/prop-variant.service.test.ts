import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../app/core/models/prop-variant.model', () => ({
  PropVariantModel: {
    findById: vi.fn(),
    findByProp: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../../app/core/services/prop.service', () => ({
  PropService: {
    get: vi.fn(),
  },
}))

import { PropVariantService } from '../../app/core/services/prop-variant.service'
import { PropVariantModel } from '../../app/core/models/prop-variant.model'
import { PropService } from '../../app/core/services/prop.service'

describe('PropVariantService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('list', () => {
    it('validates prop access then returns variants', async () => {
      vi.mocked(PropService.get).mockResolvedValue({ id: 'p1' } as any)
      vi.mocked(PropVariantModel.findByProp).mockResolvedValue([{ id: 'v1', name: 'closeup' }] as any)

      const result = await PropVariantService.list('proj1', 'p1', 'u1')
      expect(PropService.get).toHaveBeenCalledWith('proj1', 'p1', 'u1')
      expect(result).toEqual([{ id: 'v1', name: 'closeup' }])
    })
  })

  describe('get', () => {
    it('throws if variant not found', async () => {
      vi.mocked(PropService.get).mockResolvedValue({ id: 'p1' } as any)
      vi.mocked(PropVariantModel.findById).mockResolvedValue(undefined)

      await expect(PropVariantService.get('proj1', 'p1', 'v1', 'u1')).rejects.toThrow()
    })

    it('throws if variant belongs to different prop', async () => {
      vi.mocked(PropService.get).mockResolvedValue({ id: 'p1' } as any)
      vi.mocked(PropVariantModel.findById).mockResolvedValue({ id: 'v1', prop_id: 'p2' } as any)

      await expect(PropVariantService.get('proj1', 'p1', 'v1', 'u1')).rejects.toThrow()
    })

    it('returns variant when found', async () => {
      vi.mocked(PropService.get).mockResolvedValue({ id: 'p1' } as any)
      vi.mocked(PropVariantModel.findById).mockResolvedValue({ id: 'v1', prop_id: 'p1' } as any)

      const result = await PropVariantService.get('proj1', 'p1', 'v1', 'u1')
      expect(result).toEqual({ id: 'v1', prop_id: 'p1' })
    })
  })

  describe('create', () => {
    it('creates variant after validating prop', async () => {
      vi.mocked(PropService.get).mockResolvedValue({ id: 'p1' } as any)
      vi.mocked(PropVariantModel.create).mockResolvedValue({ id: 'v1', name: 'closeup' } as any)

      const result = await PropVariantService.create('proj1', 'p1', { name: 'closeup' }, 'u1')
      expect(PropVariantModel.create).toHaveBeenCalledWith('p1', { name: 'closeup' })
      expect(result).toEqual({ id: 'v1', name: 'closeup' })
    })
  })

  describe('delete', () => {
    it('deletes after validating ownership', async () => {
      vi.mocked(PropService.get).mockResolvedValue({ id: 'p1' } as any)
      vi.mocked(PropVariantModel.findById).mockResolvedValue({ id: 'v1', prop_id: 'p1' } as any)
      vi.mocked(PropVariantModel.delete).mockResolvedValue(true)

      await PropVariantService.delete('proj1', 'p1', 'v1', 'u1')
      expect(PropVariantModel.delete).toHaveBeenCalledWith('v1')
    })
  })
})
