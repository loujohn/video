import { CreativePlanModel } from '../models/creative-plan.model'
import { EntityVersionModel } from '../models/entity-version.model'
import { ProjectService } from './project.service'
import type { CreativePlan, UpdateCreativePlanInput } from '../types'

export const CreativePlanService = {
  async get(projectId: string, userId: string): Promise<CreativePlan | null> {
    await ProjectService.getProject(projectId, userId)
    const plan = await CreativePlanModel.findByProject(projectId)
    return plan || null
  },

  async update(projectId: string, input: UpdateCreativePlanInput, userId: string): Promise<CreativePlan> {
    await ProjectService.getProject(projectId, userId)

    const existing = await CreativePlanModel.findByProject(projectId)
    if (existing) {
      await EntityVersionModel.create(
        'creative_plan',
        existing.id,
        { content: existing.content, version: existing.version },
        userId,
        input.change_summary,
      )
    }

    return CreativePlanModel.upsert(projectId, input)
  },
}
