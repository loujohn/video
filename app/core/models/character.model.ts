import { getDb, buildUpdateData } from '../db'
import type { Character, CreateCharacterInput, CharacterRelation } from '../types'

const TABLE = 'characters'
const RELATIONS_TABLE = 'character_relations'

export const CharacterModel = {
  async findById(id: string): Promise<Character | undefined> {
    return getDb()(TABLE).where({ id }).first()
  },

  async findByProject(projectId: string): Promise<Character[]> {
    return getDb()(TABLE)
      .where({ project_id: projectId })
      .orderBy('sort_order', 'asc')
  },

  async create(projectId: string, input: CreateCharacterInput): Promise<Character> {
    const maxOrder = await getDb()(TABLE)
      .where({ project_id: projectId })
      .max('sort_order as max')
      .first()
    const [character] = await getDb()(TABLE)
      .insert({
        project_id: projectId,
        name: input.name,
        age: input.age ?? null,
        appearance: input.appearance ?? null,
        personality_tags: JSON.stringify(input.personality_tags || []),
        public_identity: input.public_identity ?? null,
        real_identity: input.real_identity ?? null,
        motivation: input.motivation ?? null,
        conflict_point: input.conflict_point ?? null,
        catchphrase: input.catchphrase ?? null,
        arc_description: input.arc_description ?? null,
        villain_level: input.villain_level ?? null,
        image_prompt: input.image_prompt ?? null,
        sort_order: input.sort_order ?? ((maxOrder?.max || 0) + 1),
      })
      .returning('*')
    return character
  },

  async update(id: string, data: Partial<CreateCharacterInput> & { is_active?: boolean }): Promise<Character | undefined> {
    const fields = [
      'name', 'age', 'appearance', 'public_identity', 'real_identity',
      'motivation', 'conflict_point', 'catchphrase', 'arc_description',
      'villain_level', 'image_prompt', 'sort_order', 'is_active',
    ] as const
    const updateData = buildUpdateData(data, fields)
    if (data.personality_tags !== undefined) {
      updateData.personality_tags = JSON.stringify(data.personality_tags)
    }

    const [character] = await getDb()(TABLE).where({ id }).update(updateData).returning('*')
    return character
  },

  async delete(id: string): Promise<boolean> {
    const count = await getDb()(TABLE).where({ id }).del()
    return count > 0
  },

  async getRelations(projectId: string): Promise<CharacterRelation[]> {
    return getDb()(RELATIONS_TABLE).where({ project_id: projectId })
  },

  async setRelations(projectId: string, relations: Array<{ from_character_id: string; to_character_id: string; relation_type: string; description?: string }>): Promise<CharacterRelation[]> {
    return getDb().transaction(async (trx) => {
      await trx(RELATIONS_TABLE).where({ project_id: projectId }).del()
      if (relations.length === 0) return []
      const rows = relations.map(r => ({
        project_id: projectId,
        from_character_id: r.from_character_id,
        to_character_id: r.to_character_id,
        relation_type: r.relation_type,
        description: r.description ?? null,
      }))
      return trx(RELATIONS_TABLE).insert(rows).returning('*')
    })
  },
}
