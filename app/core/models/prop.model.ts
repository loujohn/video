import { getDb, buildUpdateData } from '../db'
import type { Prop, CreatePropInput } from '../types'

const TABLE = 'props'

export const PropModel = {
  async findById(id: string): Promise<Prop | undefined> {
    return getDb()(TABLE).where({ id }).first()
  },

  async findByProject(projectId: string): Promise<Prop[]> {
    return getDb()(TABLE).where({ project_id: projectId }).orderBy('created_at', 'desc')
  },

  async create(projectId: string, input: CreatePropInput): Promise<Prop> {
    const [prop] = await getDb()(TABLE)
      .insert({
        project_id: projectId,
        name: input.name,
        description: input.description ?? null,
        tags: JSON.stringify(input.tags || []),
        image_prompt: input.image_prompt ?? null,
      })
      .returning('*')
    return prop
  },

  async update(id: string, data: Partial<CreatePropInput> & { is_active?: boolean }): Promise<Prop | undefined> {
    const fields = ['name', 'description', 'image_prompt', 'is_active'] as const
    const updateData = buildUpdateData(data, fields)
    if (data.tags !== undefined) {
      updateData.tags = JSON.stringify(data.tags)
    }

    const [prop] = await getDb()(TABLE).where({ id }).update(updateData).returning('*')
    return prop
  },

  async delete(id: string): Promise<boolean> {
    const count = await getDb()(TABLE).where({ id }).del()
    return count > 0
  },
}
