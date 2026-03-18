import { StoryboardModel } from '../models/storyboard.model'
import { EpisodeModel } from '../models/episode.model'
import { ProjectService } from './project.service'
import { notFoundError, badRequestError } from '../errors'
import type { Storyboard, CreateStoryboardInput } from '../types'

async function getEpisodeByNum(projectId: string, episodeNum: number, userId: string) {
  await ProjectService.getProject(projectId, userId)
  const episode = await EpisodeModel.findByNumber(projectId, episodeNum)
  if (!episode) notFoundError('分集不存在')
  return episode
}

export const StoryboardService = {
  async list(projectId: string, episodeNum: number, userId: string): Promise<Storyboard[]> {
    const episode = await getEpisodeByNum(projectId, episodeNum, userId)
    return StoryboardModel.findByEpisode(episode.id)
  },

  async get(projectId: string, episodeNum: number, storyboardId: string, userId: string): Promise<Storyboard> {
    const episode = await getEpisodeByNum(projectId, episodeNum, userId)
    const sb = await StoryboardModel.findById(storyboardId)
    if (!sb || sb.episode_id !== episode.id) notFoundError('分镜不存在')
    return sb
  },

  async create(projectId: string, episodeNum: number, input: CreateStoryboardInput, userId: string): Promise<Storyboard> {
    const episode = await getEpisodeByNum(projectId, episodeNum, userId)
    return StoryboardModel.create(episode.id, input)
  },

  async update(projectId: string, episodeNum: number, storyboardId: string, data: Partial<CreateStoryboardInput> & { is_active?: boolean }, userId: string): Promise<Storyboard> {
    await this.get(projectId, episodeNum, storyboardId, userId)
    const updated = await StoryboardModel.update(storyboardId, data)
    if (!updated) notFoundError('更新失败')
    return updated
  },

  async delete(projectId: string, episodeNum: number, storyboardId: string, userId: string): Promise<void> {
    await this.get(projectId, episodeNum, storyboardId, userId)
    await StoryboardModel.delete(storyboardId)
  },

  async reorder(projectId: string, episodeNum: number, orderedIds: string[], userId: string): Promise<void> {
    if (!orderedIds.length) badRequestError('ids 不能为空')
    const episode = await getEpisodeByNum(projectId, episodeNum, userId)
    await StoryboardModel.reorder(episode.id, orderedIds)
  },
}
