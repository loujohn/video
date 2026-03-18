import { AssetModel, type AssetFilters } from '../models/asset.model'
import { StorageService } from './storage.service'
import { ProjectService } from './project.service'
import { notFoundError } from '../errors'
import type { Asset, CreateAssetInput } from '../types'

export const AssetService = {
  async list(projectId: string, userId: string, filters?: AssetFilters): Promise<Asset[]> {
    await ProjectService.getProject(projectId, userId)
    return AssetModel.findByProject(projectId, filters)
  },

  async get(projectId: string, assetId: string, userId: string): Promise<Asset> {
    await ProjectService.getProject(projectId, userId)
    const asset = await AssetModel.findById(assetId)
    if (!asset || asset.project_id !== projectId) notFoundError('资源不存在')
    return asset
  },

  async create(projectId: string, input: CreateAssetInput, userId: string): Promise<Asset> {
    await ProjectService.getProject(projectId, userId)
    return AssetModel.create(projectId, input, userId)
  },

  async update(
    projectId: string,
    assetId: string,
    data: Partial<Pick<Asset, 'linked_entity_type' | 'linked_entity_id' | 'category' | 'is_active' | 'metadata'>>,
    userId: string,
  ): Promise<Asset> {
    await ProjectService.getProject(projectId, userId)
    const asset = await AssetModel.findById(assetId)
    if (!asset || asset.project_id !== projectId) notFoundError('资源不存在')
    const updated = await AssetModel.update(assetId, data)
    if (!updated) notFoundError('更新失败')
    return updated
  },

  async delete(projectId: string, assetId: string, userId: string): Promise<void> {
    await ProjectService.getProject(projectId, userId)
    const asset = await AssetModel.findById(assetId)
    if (!asset || asset.project_id !== projectId) notFoundError('资源不存在')
    await StorageService.deleteFile(asset.file_path)
    await AssetModel.delete(assetId)
  },
}
