import { getDb } from '../db'
import { EpisodeModel } from '../models/episode.model'
import { EpisodeScriptModel } from '../models/episode-script.model'
import { ProjectService } from './project.service'
import { notFoundError, badRequestError } from '../errors'
import type { Episode, EpisodeScript, CreateEpisodeInput } from '../types'

export const EpisodeService = {
  async list(projectId: string, userId: string): Promise<Episode[]> {
    await ProjectService.getProject(projectId, userId)
    return EpisodeModel.findByProject(projectId)
  },

  async getByNumber(projectId: string, episodeNumber: number, userId: string): Promise<Episode> {
    await ProjectService.getProject(projectId, userId)
    const episode = await EpisodeModel.findByNumber(projectId, episodeNumber)
    if (!episode) notFoundError('分集不存在')
    return episode
  },

  async create(projectId: string, input: CreateEpisodeInput, userId: string): Promise<Episode> {
    await ProjectService.getProject(projectId, userId)
    const existing = await EpisodeModel.findByNumber(projectId, input.episode_number)
    if (existing) badRequestError(`第 ${input.episode_number} 集已存在`)
    return EpisodeModel.create(projectId, input)
  },

  async update(projectId: string, episodeNumber: number, data: Partial<CreateEpisodeInput> & { status?: string; is_active?: boolean }, userId: string): Promise<Episode> {
    await ProjectService.getProject(projectId, userId)
    const episode = await EpisodeModel.findByNumber(projectId, episodeNumber)
    if (!episode) notFoundError('分集不存在')
    const updated = await EpisodeModel.update(episode.id, data)
    if (!updated) notFoundError('更新失败')
    return updated
  },

  async getLatestScript(projectId: string, episodeNumber: number, userId: string): Promise<EpisodeScript | null> {
    await ProjectService.getProject(projectId, userId)
    const episode = await EpisodeModel.findByNumber(projectId, episodeNumber)
    if (!episode) notFoundError('分集不存在')
    const script = await EpisodeScriptModel.findLatest(episode.id)
    return script || null
  },

  async saveScript(projectId: string, episodeNumber: number, content: string, userId: string): Promise<EpisodeScript> {
    await ProjectService.getProject(projectId, userId)
    const episode = await EpisodeModel.findByNumber(projectId, episodeNumber)
    if (!episode) notFoundError('分集不存在')
    return EpisodeScriptModel.create(episode.id, content, userId)
  },

  async delete(projectId: string, episodeNumber: number, userId: string): Promise<void> {
    await ProjectService.getProject(projectId, userId)
    const episode = await EpisodeModel.findByNumber(projectId, episodeNumber)
    if (!episode) notFoundError('分集')
    await getDb()('episode_scripts').where({ episode_id: episode.id }).del()
    await EpisodeModel.delete(episode.id)
  },
}
