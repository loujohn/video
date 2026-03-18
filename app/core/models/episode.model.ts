import { getDb } from '../db'
import type { Episode, CreateEpisodeInput } from '../types'

const TABLE = 'episodes'

export const EpisodeModel = {
  async findById(id: string): Promise<Episode | undefined> {
    return getDb()(TABLE).where({ id }).first()
  },

  async findByProject(projectId: string): Promise<Episode[]> {
    return getDb()(TABLE)
      .where({ project_id: projectId })
      .orderBy('episode_number', 'asc')
  },

  async findByNumber(projectId: string, episodeNumber: number): Promise<Episode | undefined> {
    return getDb()(TABLE)
      .where({ project_id: projectId, episode_number: episodeNumber })
      .first()
  },

  async create(projectId: string, input: CreateEpisodeInput): Promise<Episode> {
    const [episode] = await getDb()(TABLE)
      .insert({
        project_id: projectId,
        episode_number: input.episode_number,
        title: input.title ?? null,
        synopsis: input.synopsis ?? null,
        hook_type: input.hook_type ?? null,
        is_key_episode: input.is_key_episode ?? false,
        is_paywall: input.is_paywall ?? false,
        act: input.act ?? null,
        rhythm_phase: input.rhythm_phase ?? null,
      })
      .returning('*')
    return episode
  },

  async update(id: string, data: Partial<CreateEpisodeInput> & { status?: string; is_active?: boolean }): Promise<Episode | undefined> {
    const updateData: Record<string, unknown> = { updated_at: new Date() }
    if (data.episode_number !== undefined) updateData.episode_number = data.episode_number
    if (data.title !== undefined) updateData.title = data.title
    if (data.synopsis !== undefined) updateData.synopsis = data.synopsis
    if (data.hook_type !== undefined) updateData.hook_type = data.hook_type
    if (data.is_key_episode !== undefined) updateData.is_key_episode = data.is_key_episode
    if (data.is_paywall !== undefined) updateData.is_paywall = data.is_paywall
    if (data.act !== undefined) updateData.act = data.act
    if (data.rhythm_phase !== undefined) updateData.rhythm_phase = data.rhythm_phase
    if (data.status !== undefined) updateData.status = data.status
    if (data.is_active !== undefined) updateData.is_active = data.is_active

    const [episode] = await getDb()(TABLE).where({ id }).update(updateData).returning('*')
    return episode
  },

  async delete(id: string): Promise<boolean> {
    const count = await getDb()(TABLE).where({ id }).del()
    return count > 0
  },
}
