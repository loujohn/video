import { getDb } from '../db'
import type { Storyboard, CreateStoryboardInput } from '../types'

const TABLE = 'storyboards'

export const StoryboardModel = {
  async findById(id: string): Promise<Storyboard | undefined> {
    return getDb()(TABLE).where({ id }).first()
  },

  async findByEpisode(episodeId: string): Promise<Storyboard[]> {
    return getDb()(TABLE)
      .where({ episode_id: episodeId, is_active: true })
      .orderBy('sequence_number', 'asc')
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
        scene_id: input.scene_id ?? null,
        description: input.description ?? null,
        dialogue: input.dialogue ?? null,
        action_direction: input.action_direction ?? null,
        music_cue: input.music_cue ?? null,
        duration_seconds: input.duration_seconds ?? null,
        reference_image_url: input.reference_image_url ?? null,
        camera_movement: input.camera_movement ?? null,
        transition_type: input.transition_type ?? null,
        image_prompt: input.image_prompt ?? null,
      })
      .returning('*')
    return row
  },

  async update(id: string, data: Partial<CreateStoryboardInput> & { is_active?: boolean }): Promise<Storyboard | undefined> {
    const updateData: Record<string, unknown> = { updated_at: new Date() }
    if (data.sequence_number !== undefined) updateData.sequence_number = data.sequence_number
    if (data.shot_type !== undefined) updateData.shot_type = data.shot_type
    if (data.scene_id !== undefined) updateData.scene_id = data.scene_id
    if (data.description !== undefined) updateData.description = data.description
    if (data.dialogue !== undefined) updateData.dialogue = data.dialogue
    if (data.action_direction !== undefined) updateData.action_direction = data.action_direction
    if (data.music_cue !== undefined) updateData.music_cue = data.music_cue
    if (data.duration_seconds !== undefined) updateData.duration_seconds = data.duration_seconds
    if (data.reference_image_url !== undefined) updateData.reference_image_url = data.reference_image_url
    if (data.camera_movement !== undefined) updateData.camera_movement = data.camera_movement
    if (data.transition_type !== undefined) updateData.transition_type = data.transition_type
    if (data.image_prompt !== undefined) updateData.image_prompt = data.image_prompt
    if (data.is_active !== undefined) updateData.is_active = data.is_active

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
