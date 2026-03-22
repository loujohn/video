import { SceneVariantModel } from '../models/scene-variant.model'
import { SceneService } from './scene.service'
import { notFoundError } from '../errors'
import type { SceneVariant, CreateSceneVariantInput } from '../types'

export const SceneVariantService = {
  async list(projectId: string, sceneId: string, userId: string): Promise<SceneVariant[]> {
    await SceneService.get(projectId, sceneId, userId)
    return SceneVariantModel.findByScene(sceneId)
  },

  async get(projectId: string, sceneId: string, variantId: string, userId: string): Promise<SceneVariant> {
    await SceneService.get(projectId, sceneId, userId)
    const variant = await SceneVariantModel.findById(variantId)
    if (!variant || variant.scene_id !== sceneId) notFoundError('场景变体不存在')
    return variant
  },

  async create(projectId: string, sceneId: string, input: CreateSceneVariantInput, userId: string): Promise<SceneVariant> {
    await SceneService.get(projectId, sceneId, userId)
    return SceneVariantModel.create(sceneId, input)
  },

  async update(projectId: string, sceneId: string, variantId: string, data: Partial<CreateSceneVariantInput> & { is_active?: boolean }, userId: string): Promise<SceneVariant> {
    await SceneService.get(projectId, sceneId, userId)
    const variant = await SceneVariantModel.findById(variantId)
    if (!variant || variant.scene_id !== sceneId) notFoundError('场景变体不存在')
    const updated = await SceneVariantModel.update(variantId, data)
    if (!updated) notFoundError('更新失败')
    return updated
  },

  async delete(projectId: string, sceneId: string, variantId: string, userId: string): Promise<void> {
    await SceneService.get(projectId, sceneId, userId)
    const variant = await SceneVariantModel.findById(variantId)
    if (!variant || variant.scene_id !== sceneId) notFoundError('场景变体不存在')
    await SceneVariantModel.delete(variantId)
  },
}
