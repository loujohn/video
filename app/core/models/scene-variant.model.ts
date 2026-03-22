import { getDb, buildUpdateData } from '../db'
import type { SceneVariant, CreateSceneVariantInput } from '../types'

const TABLE = 'scene_variants'

export const SceneVariantModel = {
  async findById(id: string): Promise<SceneVariant | undefined> {
    return getDb()(TABLE).where({ id }).first()
  },

  async findByScene(sceneId: string): Promise<SceneVariant[]> {
    return getDb()(TABLE)
      .where({ scene_id: sceneId })
      .orderBy('sort_order', 'asc')
  },

  async create(sceneId: string, input: CreateSceneVariantInput): Promise<SceneVariant> {
    const maxOrder = await getDb()(TABLE)
      .where({ scene_id: sceneId })
      .max('sort_order as max')
      .first()
    const [row] = await getDb()(TABLE)
      .insert({
        scene_id: sceneId,
        name: input.name,
        description: input.description ?? null,
        image_prompt: input.image_prompt ?? null,
        variant_type: input.variant_type ?? null,
        sort_order: input.sort_order ?? ((maxOrder?.max || 0) + 1),
      })
      .returning('*')
    return row
  },

  async update(id: string, data: Partial<CreateSceneVariantInput> & { is_active?: boolean }): Promise<SceneVariant | undefined> {
    const fields = ['name', 'description', 'image_prompt', 'variant_type', 'sort_order', 'is_active'] as const
    const updateData = buildUpdateData(data, fields)
    const [row] = await getDb()(TABLE).where({ id }).update(updateData).returning('*')
    return row
  },

  async delete(id: string): Promise<boolean> {
    const count = await getDb()(TABLE).where({ id }).del()
    return count > 0
  },
}
