import { getDb } from '../db'

const TABLE = 'storyboard_prop_variants'

export const StoryboardPropVariantModel = {
  async findByStoryboard(storyboardId: string) {
    return getDb()(TABLE)
      .join('prop_variants', 'prop_variants.id', `${TABLE}.prop_variant_id`)
      .join('props', 'props.id', 'prop_variants.prop_id')
      .where(`${TABLE}.storyboard_id`, storyboardId)
      .orderBy(`${TABLE}.sort_order`, 'asc')
      .select(
        'prop_variants.id',
        'prop_variants.name',
        'prop_variants.prop_id',
        'props.name as prop_name',
      )
  },

  async findStoryboardsByProp(propId: string): Promise<string[]> {
    const rows = await getDb()(TABLE)
      .join('prop_variants', 'prop_variants.id', `${TABLE}.prop_variant_id`)
      .where('prop_variants.prop_id', propId)
      .select(`${TABLE}.storyboard_id`)
      .distinct()
    return rows.map((r: any) => r.storyboard_id)
  },

  async sync(storyboardId: string, propVariantIds: string[]): Promise<void> {
    await getDb()(TABLE).where({ storyboard_id: storyboardId }).del()
    if (propVariantIds.length) {
      const rows = propVariantIds.map((id, i) => ({
        storyboard_id: storyboardId,
        prop_variant_id: id,
        sort_order: i,
      }))
      await getDb()(TABLE).insert(rows)
    }
  },
}
