import { getDb } from '../db'

const TABLE = 'storyboard_character_looks'

export const StoryboardCharacterLookModel = {
  async findByStoryboard(storyboardId: string) {
    return getDb()(TABLE)
      .join('character_looks', 'character_looks.id', `${TABLE}.character_look_id`)
      .join('characters', 'characters.id', 'character_looks.character_id')
      .where(`${TABLE}.storyboard_id`, storyboardId)
      .orderBy(`${TABLE}.sort_order`, 'asc')
      .select(
        'character_looks.id',
        'character_looks.name',
        'character_looks.character_id',
        'characters.name as character_name',
      )
  },

  async findStoryboardsByCharacter(characterId: string): Promise<string[]> {
    const rows = await getDb()(TABLE)
      .join('character_looks', 'character_looks.id', `${TABLE}.character_look_id`)
      .where('character_looks.character_id', characterId)
      .select(`${TABLE}.storyboard_id`)
      .distinct()
    return rows.map((r: any) => r.storyboard_id)
  },

  async sync(storyboardId: string, characterLookIds: string[]): Promise<void> {
    await getDb()(TABLE).where({ storyboard_id: storyboardId }).del()
    if (characterLookIds.length) {
      const rows = characterLookIds.map((id, i) => ({
        storyboard_id: storyboardId,
        character_look_id: id,
        sort_order: i,
      }))
      await getDb()(TABLE).insert(rows)
    }
  },
}
