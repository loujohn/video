import { getDb, buildUpdateData } from '../db'
import type { Storyboard, CreateStoryboardInput } from '../types'

const TABLE = 'storyboards'

export const StoryboardModel = {
  async findById(id: string): Promise<Storyboard | undefined> {
    return getDb()(TABLE)
      .leftJoin('users', `${TABLE}.assigned_to`, 'users.id')
      .where({ [`${TABLE}.id`]: id })
      .select(`${TABLE}.*`, 'users.name as assigned_to_name')
      .first()
  },

  async findByEpisode(episodeId: string): Promise<Storyboard[]> {
    return getDb()(TABLE)
      .leftJoin('users', `${TABLE}.assigned_to`, 'users.id')
      .where({ [`${TABLE}.episode_id`]: episodeId, [`${TABLE}.is_active`]: true })
      .orderBy(`${TABLE}.sequence_number`, 'asc')
      .select(`${TABLE}.*`, 'users.name as assigned_to_name')
  },

  async create(episodeId: string, input: CreateStoryboardInput): Promise<Storyboard> {
    let seqNum = input.sequence_number
    if (seqNum == null) {
      const max = await getDb()(TABLE)
        .where({ episode_id: episodeId })
        .max('sequence_number as max')
        .first()
      seqNum = ((max?.max as number) || 0) + 1
    }

    const [row] = await getDb()(TABLE)
      .insert({
        episode_id: episodeId,
        sequence_number: seqNum,
        shot_type: input.shot_type ?? null,
        camera_angle: input.camera_angle ?? null,
        scene_id: input.scene_id ?? null,
        scene_variant_id: input.scene_variant_id ?? null,
        description: input.description ?? null,
        dialogue: input.dialogue ?? null,
        action_direction: input.action_direction ?? null,
        music_cue: input.music_cue ?? null,
        sound_effects: input.sound_effects ?? null,
        notes: input.notes ?? null,
        duration_seconds: input.duration_seconds ?? null,
        reference_image_url: input.reference_image_url ?? null,
        camera_movement: input.camera_movement ?? null,
        transition_type: input.transition_type ?? null,
        image_prompt: input.image_prompt ?? null,
        assigned_to: input.assigned_to ?? null,
      })
      .returning('*')
    return row
  },

  async update(id: string, data: Partial<CreateStoryboardInput> & { is_active?: boolean }): Promise<Storyboard | undefined> {
    const fields = [
      'sequence_number', 'shot_type', 'camera_angle', 'scene_id', 'scene_variant_id',
      'description', 'dialogue', 'action_direction', 'music_cue', 'sound_effects',
      'notes', 'duration_seconds', 'reference_image_url', 'camera_movement',
      'transition_type', 'image_prompt', 'is_active', 'assigned_to',
    ] as const
    const updateData = buildUpdateData(data, fields)

    const [row] = await getDb()(TABLE).where({ id }).update(updateData).returning('*')
    return row
  },

  async delete(id: string): Promise<boolean> {
    const count = await getDb()(TABLE).where({ id }).del()
    return count > 0
  },

  async reorder(episodeId: string, orderedIds: string[]): Promise<void> {
    const existing = await getDb()(TABLE)
      .where({ episode_id: episodeId, is_active: true })
      .select('id')
    const existingIds = new Set(existing.map((r) => r.id))
    if (orderedIds.length !== existingIds.size || orderedIds.some((id) => !existingIds.has(id))) {
      throw new Error('ids 必须包含该分集的全部分镜')
    }

    const trx = await getDb().transaction()
    try {
      for (let i = 0; i < orderedIds.length; i++) {
        await trx(TABLE)
          .where({ id: orderedIds[i], episode_id: episodeId })
          .update({ sequence_number: i + 1, updated_at: new Date() })
      }
      await trx.commit()
    } catch (err) {
      await trx.rollback()
      throw err
    }
  },
}
