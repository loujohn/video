import { getDb } from '../db'
import type { Comment, CommentWithAuthor, CreateCommentInput, UpdateCommentInput, CommentEntityType } from '../types'

const TABLE = 'comments'

export const CommentModel = {
  async findById(id: string): Promise<Comment | undefined> {
    return getDb()(TABLE).where({ id }).first()
  },

  async findByEntity(projectId: string, entityType: CommentEntityType, entityId: string): Promise<CommentWithAuthor[]> {
    return getDb()(TABLE)
      .join('users', `${TABLE}.created_by`, 'users.id')
      .where({
        [`${TABLE}.project_id`]: projectId,
        [`${TABLE}.entity_type`]: entityType,
        [`${TABLE}.entity_id`]: entityId,
      })
      .select(`${TABLE}.*`, 'users.name as author_name', 'users.email as author_email')
      .orderBy(`${TABLE}.created_at`, 'asc')
  },

  async countByEntity(projectId: string, entityType: CommentEntityType, entityId: string): Promise<number> {
    const result = await getDb()(TABLE)
      .where({ project_id: projectId, entity_type: entityType, entity_id: entityId })
      .count('id as count')
      .first()
    return Number(result?.count || 0)
  },

  async countByEntities(projectId: string, entityType: CommentEntityType, entityIds: string[]): Promise<Record<string, number>> {
    if (!entityIds.length) return {}
    const rows = await getDb()(TABLE)
      .where({ project_id: projectId, entity_type: entityType })
      .whereIn('entity_id', entityIds)
      .groupBy('entity_id')
      .select('entity_id')
      .count('id as count')
    const map: Record<string, number> = {}
    for (const row of rows) {
      map[row.entity_id as string] = Number((row as any).count || 0)
    }
    return map
  },

  async create(projectId: string, input: CreateCommentInput, userId: string): Promise<Comment> {
    const [row] = await getDb()(TABLE)
      .insert({
        project_id: projectId,
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        parent_id: input.parent_id ?? null,
        content: input.content,
        mentions: input.mentions?.length ? `{${input.mentions.join(',')}}` : '{}',
        created_by: userId,
      })
      .returning('*')
    return row
  },

  async update(id: string, data: UpdateCommentInput): Promise<Comment | undefined> {
    const updateData: Record<string, unknown> = { updated_at: new Date() }
    if (data.content !== undefined) updateData.content = data.content
    if (data.status !== undefined) updateData.status = data.status
    const [row] = await getDb()(TABLE).where({ id }).update(updateData).returning('*')
    return row
  },

  async delete(id: string): Promise<boolean> {
    const count = await getDb()(TABLE).where({ id }).del()
    return count > 0
  },
}
