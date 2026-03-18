import { SceneModel } from '../models/scene.model'
import { ProjectService } from './project.service'
import { notFoundError } from '../errors'
import type { Scene, CreateSceneInput } from '../types'

export const SceneService = {
  async list(projectId: string, userId: string): Promise<Scene[]> {
    await ProjectService.getProject(projectId, userId)
    return SceneModel.findByProject(projectId)
  },

  async get(projectId: string, sceneId: string, userId: string): Promise<Scene> {
    await ProjectService.getProject(projectId, userId)
    const scene = await SceneModel.findById(sceneId)
    if (!scene || scene.project_id !== projectId) notFoundError('场景不存在')
    return scene
  },

  async create(projectId: string, input: CreateSceneInput, userId: string): Promise<Scene> {
    await ProjectService.getProject(projectId, userId)
    return SceneModel.create(projectId, input)
  },

  async update(projectId: string, sceneId: string, data: Partial<CreateSceneInput> & { is_active?: boolean }, userId: string): Promise<Scene> {
    await ProjectService.getProject(projectId, userId)
    const scene = await SceneModel.findById(sceneId)
    if (!scene || scene.project_id !== projectId) notFoundError('场景不存在')
    const updated = await SceneModel.update(sceneId, data)
    if (!updated) notFoundError('更新失败')
    return updated
  },

  async delete(projectId: string, sceneId: string, userId: string): Promise<void> {
    await ProjectService.getProject(projectId, userId)
    const scene = await SceneModel.findById(sceneId)
    if (!scene || scene.project_id !== projectId) notFoundError('场景不存在')
    await SceneModel.delete(sceneId)
  },
}
