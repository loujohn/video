import { getDb, buildUpdateData } from '../db'
import type { CharacterLook, CreateCharacterLookInput } from '../types'

const TABLE = 'character_looks'

export const CharacterLookModel = {
  async findById(id: string): Promise<CharacterLook | undefined> {
    return getDb()(TABLE).where({ id }).first()
  },

  async findByCharacter(characterId: string): Promise<CharacterLook[]> {
    const db = getDb()
    const looks = await db(TABLE)
      .where({ character_id: characterId, is_active: true })
      .orderBy('sort_order', 'asc')

    if (!looks.length) return looks

    const lookIds = looks.map((l: CharacterLook) => l.id)
    const covers = await db('assets')
      .whereIn('linked_entity_id', lookIds)
      .where({ linked_entity_type: 'character_look', is_active: true })
      .andWhereRaw("(metadata->>'is_cover')::boolean = true")
      .select('linked_entity_id', 'file_path')

    const coverMap = new Map(covers.map((c: any) => [c.linked_entity_id, `/uploads/${c.file_path}`]))

    const fallbackIds = lookIds.filter((id: string) => !coverMap.has(id))
    if (fallbackIds.length) {
      const latestAssets = await db('assets')
        .whereIn('linked_entity_id', fallbackIds)
        .where({ linked_entity_type: 'character_look', is_active: true, type: 'image' })
        .distinctOn('linked_entity_id')
        .orderByRaw('linked_entity_id, created_at DESC')
        .select('linked_entity_id', 'file_path')

      for (const a of latestAssets) {
        if (!coverMap.has(a.linked_entity_id)) {
          coverMap.set(a.linked_entity_id, `/uploads/${a.file_path}`)
        }
      }
    }

    return looks.map((l: CharacterLook) => ({ ...l, cover_asset_url: coverMap.get(l.id) || null }))
  },

  async create(characterId: string, input: CreateCharacterLookInput): Promise<CharacterLook> {
    const maxOrder = await getDb()(TABLE)
      .where({ character_id: characterId })
      .max('sort_order as max')
      .first()
    const [row] = await getDb()(TABLE)
      .insert({
        character_id: characterId,
        name: input.name,
        description: input.description ?? null,
        image_prompt: input.image_prompt ?? null,
        is_base: input.is_base ?? false,
        sort_order: input.sort_order ?? ((maxOrder?.max || 0) + 1),
      })
      .returning('*')
    return row
  },

  async update(id: string, data: Partial<CreateCharacterLookInput> & { is_active?: boolean }): Promise<CharacterLook | undefined> {
    const fields = ['name', 'description', 'image_prompt', 'is_base', 'sort_order', 'is_active', 'review_status'] as const
    const updateData = buildUpdateData(data, fields)
    const [row] = await getDb()(TABLE).where({ id }).update(updateData).returning('*')
    return row
  },

  async delete(id: string): Promise<boolean> {
    const count = await getDb()(TABLE).where({ id }).del()
    return count > 0
  },
}
