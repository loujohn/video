import { getDb } from '../db'
import type { EntityVersion } from '../types'

const TABLE = 'entity_versions'

export const EntityVersionModel = {
  async findByEntity(entityType: string, entityId: string): Promise<EntityVersion[]> {
    return getDb()(TABLE)
      .where({ entity_type: entityType, entity_id: entityId })
      .orderBy('version_number', 'desc')
  },

  async create(
    entityType: string,
    entityId: string,
    snapshot: Record<string, unknown>,
    userId: string,
    changeSummary?: string,
  ): Promise<EntityVersion> {
    const latest = await getDb()(TABLE)
      .where({ entity_type: entityType, entity_id: entityId })
      .max('version_number as max')
      .first()
    const nextVersion = ((latest?.max as number) || 0) + 1

    const [version] = await getDb()(TABLE)
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        version_number: nextVersion,
        snapshot: JSON.stringify(snapshot),
        change_summary: changeSummary ?? null,
        created_by: userId,
      })
      .returning('*')
    return version
  },
}
