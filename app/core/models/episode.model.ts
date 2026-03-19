import { getDb, buildUpdateData } from '../db'
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
    const fields = [
      'episode_number', 'title', 'synopsis', 'hook_type',
      'is_key_episode', 'is_paywall', 'act', 'rhythm_phase',
      'status', 'is_active',
    ] as const
    const updateData = buildUpdateData(data, fields)

    const [episode] = await getDb()(TABLE).where({ id }).update(updateData).returning('*')
    return episode
  },

  async delete(id: string): Promise<boolean> {
    const count = await getDb()(TABLE).where({ id }).del()
    return count > 0
  },
}
