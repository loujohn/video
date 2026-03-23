import { getDb, buildUpdateData } from '../db'
import type { Scene, CreateSceneInput } from '../types'

const TABLE = 'scenes'

export const SceneModel = {
  async findById(id: string): Promise<Scene | undefined> {
    return getDb()(TABLE)
      .leftJoin('users', `${TABLE}.assigned_to`, 'users.id')
      .where({ [`${TABLE}.id`]: id })
      .select(`${TABLE}.*`, 'users.name as assigned_to_name')
      .first()
  },

  async findByProject(projectId: string): Promise<Scene[]> {
    return getDb()(TABLE)
      .leftJoin('users', `${TABLE}.assigned_to`, 'users.id')
      .where({ [`${TABLE}.project_id`]: projectId })
      .orderBy(`${TABLE}.created_at`, 'desc')
      .select(`${TABLE}.*`, 'users.name as assigned_to_name')
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
        image_prompt: input.image_prompt ?? null,
        assigned_to: input.assigned_to ?? null,
      })
      .returning('*')
    return scene
  },

  async update(id: string, data: Partial<CreateSceneInput> & { is_active?: boolean }): Promise<Scene | undefined> {
    const fields = [
      'name', 'location_type', 'time_of_day', 'description',
      'image_prompt', 'is_active', 'assigned_to',
    ] as const
    const updateData = buildUpdateData(data, fields)
    if (data.tags !== undefined) {
      updateData.tags = JSON.stringify(data.tags)
    }

    const [scene] = await getDb()(TABLE).where({ id }).update(updateData).returning('*')
    return scene
  },

  async delete(id: string): Promise<boolean> {
    const count = await getDb()(TABLE).where({ id }).del()
    return count > 0
  },
}
