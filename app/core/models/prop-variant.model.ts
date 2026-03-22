import { getDb, buildUpdateData } from '../db'
import type { PropVariant, CreatePropVariantInput } from '../types'

const TABLE = 'prop_variants'

export const PropVariantModel = {
  async findById(id: string): Promise<PropVariant | undefined> {
    return getDb()(TABLE).where({ id }).first()
  },

  async findByProp(propId: string): Promise<PropVariant[]> {
    return getDb()(TABLE)
      .where({ prop_id: propId, is_active: true })
      .orderBy('sort_order', 'asc')
  },

  async create(propId: string, input: CreatePropVariantInput): Promise<PropVariant> {
    const maxOrder = await getDb()(TABLE)
      .where({ prop_id: propId })
      .max('sort_order as max')
      .first()
    const [row] = await getDb()(TABLE)
      .insert({
        prop_id: propId,
        name: input.name,
        description: input.description ?? null,
        image_prompt: input.image_prompt ?? null,
        variant_type: input.variant_type ?? null,
        sort_order: input.sort_order ?? ((maxOrder?.max || 0) + 1),
      })
      .returning('*')
    return row
  },

  async update(id: string, data: Partial<CreatePropVariantInput> & { is_active?: boolean }): Promise<PropVariant | undefined> {
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
