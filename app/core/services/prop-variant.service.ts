import { PropVariantModel } from '../models/prop-variant.model'
import { PropService } from './prop.service'
import { notFoundError } from '../errors'
import type { PropVariant, CreatePropVariantInput } from '../types'

export const PropVariantService = {
  async list(projectId: string, propId: string, userId: string): Promise<PropVariant[]> {
    await PropService.get(projectId, propId, userId)
    return PropVariantModel.findByProp(propId)
  },

  async get(projectId: string, propId: string, variantId: string, userId: string): Promise<PropVariant> {
    await PropService.get(projectId, propId, userId)
    const variant = await PropVariantModel.findById(variantId)
    if (!variant || variant.prop_id !== propId) notFoundError('道具变体不存在')
    return variant!
  },

  async create(projectId: string, propId: string, input: CreatePropVariantInput, userId: string): Promise<PropVariant> {
    await PropService.get(projectId, propId, userId)
    return PropVariantModel.create(propId, input)
  },

  async update(projectId: string, propId: string, variantId: string, data: Partial<CreatePropVariantInput> & { is_active?: boolean }, userId: string): Promise<PropVariant> {
    await PropService.get(projectId, propId, userId)
    const variant = await PropVariantModel.findById(variantId)
    if (!variant || variant.prop_id !== propId) notFoundError('道具变体不存在')
    const updated = await PropVariantModel.update(variantId, data)
    if (!updated) notFoundError('更新失败')
    return updated!
  },

  async delete(projectId: string, propId: string, variantId: string, userId: string): Promise<void> {
    await PropService.get(projectId, propId, userId)
    const variant = await PropVariantModel.findById(variantId)
    if (!variant || variant.prop_id !== propId) notFoundError('道具变体不存在')
    await PropVariantModel.delete(variantId)
  },
}
