import { EntityVersionModel } from '../models/entity-version.model'
import type { EntityVersion } from '../types'

export const VersionService = {
  async getHistory(entityType: string, entityId: string): Promise<EntityVersion[]> {
    return EntityVersionModel.findByEntity(entityType, entityId)
  },
}
