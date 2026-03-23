import { getDb, buildUpdateData } from '../db'
import type { PropVariant, CreatePropVariantInput } from '../types'

const TABLE = 'prop_variants'

export const PropVariantModel = {
  async findById(id: string): Promise<PropVariant | undefined> {
    return getDb()(TABLE).where({ id }).first()
  },

  async findByProp(propId: string): Promise<PropVariant[]> {
    const db = getDb()
    const variants = await db(TABLE)
      .where({ prop_id: propId, is_active: true })
      .orderBy('sort_order', 'asc')

    if (!variants.length) return variants

    const variantIds = variants.map((v: PropVariant) => v.id)
    const covers = await db('assets')
      .whereIn('linked_entity_id', variantIds)
      .where({ linked_entity_type: 'prop_variant', is_active: true })
      .andWhereRaw("(metadata->>'is_cover')::boolean = true")
      .select('linked_entity_id', 'file_path')

    const coverMap = new Map(covers.map((c: any) => [c.linked_entity_id, `/uploads/${c.file_path}`]))

    const fallbackIds = variantIds.filter((id: string) => !coverMap.has(id))
    if (fallbackIds.length) {
      const latestAssets = await db('assets')
        .whereIn('linked_entity_id', fallbackIds)
        .where({ linked_entity_type: 'prop_variant', is_active: true, type: 'image' })
        .distinctOn('linked_entity_id')
        .orderByRaw('linked_entity_id, created_at DESC')
        .select('linked_entity_id', 'file_path')

      for (const a of latestAssets) {
        if (!coverMap.has(a.linked_entity_id)) {
          coverMap.set(a.linked_entity_id, `/uploads/${a.file_path}`)
        }
      }
    }

    return variants.map((v: PropVariant) => ({ ...v, cover_asset_url: coverMap.get(v.id) || null }))
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
    const fields = ['name', 'description', 'image_prompt', 'variant_type', 'sort_order', 'is_active', 'review_status'] as const
    const updateData = buildUpdateData(data, fields)
    const [row] = await getDb()(TABLE).where({ id }).update(updateData).returning('*')
    return row
  },

  async delete(id: string): Promise<boolean> {
    const count = await getDb()(TABLE).where({ id }).del()
    return count > 0
  },
}
