import { getDb, buildUpdateData } from '../db'
import type { CharacterLook, CreateCharacterLookInput } from '../types'

const TABLE = 'character_looks'

export const CharacterLookModel = {
  async findById(id: string): Promise<CharacterLook | undefined> {
    return getDb()(TABLE).where({ id }).first()
  },

  async findByCharacter(characterId: string): Promise<CharacterLook[]> {
    return getDb()(TABLE)
      .where({ character_id: characterId, is_active: true })
      .orderBy('sort_order', 'asc')
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
    const fields = ['name', 'description', 'image_prompt', 'is_base', 'sort_order', 'is_active'] as const
    const updateData = buildUpdateData(data, fields)
    const [row] = await getDb()(TABLE).where({ id }).update(updateData).returning('*')
    return row
  },

  async delete(id: string): Promise<boolean> {
    const count = await getDb()(TABLE).where({ id }).del()
    return count > 0
  },
}
