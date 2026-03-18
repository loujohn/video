import { getDb } from '../db'
import type { Scene, CreateSceneInput } from '../types'

const TABLE = 'scenes'

export const SceneModel = {
  async findById(id: string): Promise<Scene | undefined> {
    return getDb()(TABLE).where({ id }).first()
  },

  async findByProject(projectId: string): Promise<Scene[]> {
    return getDb()(TABLE).where({ project_id: projectId }).orderBy('created_at', 'desc')
  },

  async create(projectId: string, input: CreateSceneInput): Promise<Scene> {
    const [scene] = await getDb()(TABLE)
      .insert({
        project_id: projectId,
        name: input.name,
        location_type: input.location_type ?? null,
        time_of_day: input.time_of_day ?? null,
        description: input.description ?? null,
        tags: JSON.stringify(input.tags || []),
      })
      .returning('*')
    return scene
  },

  async update(id: string, data: Partial<CreateSceneInput> & { is_active?: boolean }): Promise<Scene | undefined> {
    const updateData: Record<string, unknown> = { updated_at: new Date() }
    if (data.name !== undefined) updateData.name = data.name
    if (data.location_type !== undefined) updateData.location_type = data.location_type
    if (data.time_of_day !== undefined) updateData.time_of_day = data.time_of_day
    if (data.description !== undefined) updateData.description = data.description
    if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags)
    if (data.is_active !== undefined) updateData.is_active = data.is_active

    const [scene] = await getDb()(TABLE).where({ id }).update(updateData).returning('*')
    return scene
  },

  async delete(id: string): Promise<boolean> {
    const count = await getDb()(TABLE).where({ id }).del()
    return count > 0
  },
}
