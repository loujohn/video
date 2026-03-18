import { PropModel } from '../models/prop.model'
import { ProjectService } from './project.service'
import { notFoundError } from '../errors'
import type { Prop, CreatePropInput } from '../types'

export const PropService = {
  async list(projectId: string, userId: string): Promise<Prop[]> {
    await ProjectService.getProject(projectId, userId)
    return PropModel.findByProject(projectId)
  },

  async get(projectId: string, propId: string, userId: string): Promise<Prop> {
    await ProjectService.getProject(projectId, userId)
    const prop = await PropModel.findById(propId)
    if (!prop || prop.project_id !== projectId) notFoundError('道具不存在')
    return prop
  },

  async create(projectId: string, input: CreatePropInput, userId: string): Promise<Prop> {
    await ProjectService.getProject(projectId, userId)
    return PropModel.create(projectId, input)
  },

  async update(projectId: string, propId: string, data: Partial<CreatePropInput> & { is_active?: boolean }, userId: string): Promise<Prop> {
    await ProjectService.getProject(projectId, userId)
    const prop = await PropModel.findById(propId)
    if (!prop || prop.project_id !== projectId) notFoundError('道具不存在')
    const updated = await PropModel.update(propId, data)
    if (!updated) notFoundError('更新失败')
    return updated
  },

  async delete(projectId: string, propId: string, userId: string): Promise<void> {
    await ProjectService.getProject(projectId, userId)
    const prop = await PropModel.findById(propId)
    if (!prop || prop.project_id !== projectId) notFoundError('道具不存在')
    await PropModel.delete(propId)
  },
}
