import { getDb } from '../db'
import { EntityVersionModel } from '../models/entity-version.model'
import { forbiddenError, badRequestError } from '../errors'
import type { EntityVersion } from '../types'

async function validateEntityOwnership(entityType: string, entityId: string, projectId: string): Promise<void> {
  let row: { project_id: string } | undefined
  if (entityType === 'creative_plan') {
    row = await getDb()('creative_plans').where({ id: entityId }).select('project_id').first()
  } else if (entityType === 'episode_script') {
    row = await getDb()('episodes').where({ id: entityId }).select('project_id').first()
  } else {
    badRequestError(`不支持的实体类型: ${entityType}`)
  }
  if (!row || row.project_id !== projectId) {
    forbiddenError('无权访问该实体的版本历史')
  }
}

export const VersionService = {
  async getHistory(entityType: string, entityId: string, projectId: string): Promise<EntityVersion[]> {
    await validateEntityOwnership(entityType, entityId, projectId)
    return EntityVersionModel.findByEntity(entityType, entityId)
  },
}
