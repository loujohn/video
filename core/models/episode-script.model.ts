import { getDb } from '../db'
import type { EpisodeScript } from '../types'

const TABLE = 'episode_scripts'

export const EpisodeScriptModel = {
  async findLatest(episodeId: string): Promise<EpisodeScript | undefined> {
    return getDb()(TABLE)
      .where({ episode_id: episodeId })
      .orderBy('version', 'desc')
      .first()
  },

  async findAll(episodeId: string): Promise<EpisodeScript[]> {
    return getDb()(TABLE)
      .where({ episode_id: episodeId })
      .orderBy('version', 'desc')
  },

  async create(episodeId: string, content: string, userId: string): Promise<EpisodeScript> {
    const latest = await this.findLatest(episodeId)
    const nextVersion = (latest?.version || 0) + 1
    const wordCount = content.replace(/\s/g, '').length

    const [script] = await getDb()(TABLE)
      .insert({
        episode_id: episodeId,
        content,
        version: nextVersion,
        word_count: wordCount,
        created_by: userId,
      })
      .returning('*')
    return script
  },
}
