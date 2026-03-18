import { getDb } from '../db'
import type { CreativePlan, UpdateCreativePlanInput } from '../types'

const TABLE = 'creative_plans'

export const CreativePlanModel = {
  async findByProject(projectId: string): Promise<CreativePlan | undefined> {
    return getDb()(TABLE).where({ project_id: projectId }).first()
  },

  async upsert(projectId: string, input: UpdateCreativePlanInput): Promise<CreativePlan> {
    const existing = await this.findByProject(projectId)
    if (existing) {
      const [plan] = await getDb()(TABLE)
        .where({ id: existing.id })
        .update({
          content: JSON.stringify(input.content),
          version: existing.version + 1,
          updated_at: new Date(),
        })
        .returning('*')
      return plan
    }
    const [plan] = await getDb()(TABLE)
      .insert({
        project_id: projectId,
        content: JSON.stringify(input.content),
        version: 1,
      })
      .returning('*')
    return plan
  },
}
