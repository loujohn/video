import { getDb } from '../db'
import type { Asset, CreateAssetInput } from '../types'

const TABLE = 'assets'

export interface AssetFilters {
  type?: string
  category?: string
  tags?: string
  linked_entity_type?: string
  linked_entity_id?: string
  is_active?: boolean | 'all'
}

export const AssetModel = {
  async findById(id: string): Promise<Asset | undefined> {
    return getDb()(TABLE).where({ id }).first()
  },

  async findByProject(projectId: string, filters?: AssetFilters): Promise<Asset[]> {
    const query = getDb()(TABLE).where({ project_id: projectId })
    if (filters?.is_active === 'all') { /* no filter */ }
    else if (filters?.is_active === false) query.andWhere('is_active', false)
    else query.andWhere('is_active', true)
    if (filters?.type) query.andWhere('type', filters.type)
    if (filters?.category) query.andWhere('category', filters.category)
    if (filters?.tags) query.andWhereRaw("tags @> ?::jsonb", [JSON.stringify([filters.tags])])
    if (filters?.linked_entity_type) query.andWhere('linked_entity_type', filters.linked_entity_type)
    if (filters?.linked_entity_id) query.andWhere('linked_entity_id', filters.linked_entity_id)
    return query.orderBy('created_at', 'desc')
  },

  async create(projectId: string, input: CreateAssetInput, userId: string): Promise<Asset> {
    const [row] = await getDb()(TABLE)
      .insert({
        project_id: projectId,
        type: input.type,
        category: input.category,
        file_path: input.file_path,
        file_name: input.file_name ?? null,
        file_size: input.file_size ?? null,
        mime_type: input.mime_type ?? null,
        metadata: JSON.stringify(input.metadata || {}),
        tags: JSON.stringify(input.tags || []),
        linked_entity_type: input.linked_entity_type ?? null,
        linked_entity_id: input.linked_entity_id ?? null,
        created_by: userId,
      })
      .returning('*')
    return row
  },

  async update(id: string, data: Partial<Pick<Asset, 'linked_entity_type' | 'linked_entity_id' | 'category' | 'tags' | 'is_active' | 'metadata'>>): Promise<Asset | undefined> {
    const updateData: Record<string, unknown> = {}
    if (data.linked_entity_type !== undefined) updateData.linked_entity_type = data.linked_entity_type
    if (data.linked_entity_id !== undefined) updateData.linked_entity_id = data.linked_entity_id
    if (data.category !== undefined) updateData.category = data.category
    if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags)
    if (data.is_active !== undefined) updateData.is_active = data.is_active
    if (data.metadata !== undefined) updateData.metadata = JSON.stringify(data.metadata)

    if (Object.keys(updateData).length === 0) return this.findById(id)
    const [row] = await getDb()(TABLE).where({ id }).update(updateData).returning('*')
    return row
  },

  async findByEntities(projectId: string, entityType: string, entityIds: string[], activeOnly = true): Promise<Asset[]> {
    const query = getDb()(TABLE)
      .where({ project_id: projectId, linked_entity_type: entityType, type: 'image' })
      .whereIn('linked_entity_id', entityIds)
    if (activeOnly) query.andWhere('is_active', true)
    return query.orderBy('created_at', 'desc')
  },

  async delete(id: string): Promise<boolean> {
    const count = await getDb()(TABLE).where({ id }).del()
    return count > 0
  },
}
