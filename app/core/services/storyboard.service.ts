import { StoryboardModel } from '../models/storyboard.model'
import { EpisodeModel } from '../models/episode.model'
import { StoryboardCharacterLookModel } from '../models/storyboard-character-look.model'
import { StoryboardPropVariantModel } from '../models/storyboard-prop-variant.model'
import { ProjectService } from './project.service'
import { notFoundError, badRequestError } from '../errors'
import type { Storyboard, CreateStoryboardInput, StoryboardWithAssociations } from '../types'
import { getDb } from '../db'

async function getEpisodeByNum(projectId: string, episodeNum: number, userId: string) {
  await ProjectService.getProject(projectId, userId)
  const episode = await EpisodeModel.findByNumber(projectId, episodeNum)
  if (!episode) notFoundError('分集不存在')
  return episode
}

async function syncAssociations(storyboardId: string, input: CreateStoryboardInput) {
  if (input.character_look_ids !== undefined) {
    await StoryboardCharacterLookModel.sync(storyboardId, input.character_look_ids)
  }
  if (input.prop_variant_ids !== undefined) {
    await StoryboardPropVariantModel.sync(storyboardId, input.prop_variant_ids)
  }
}

async function enrichWithAssociations(sb: Storyboard): Promise<StoryboardWithAssociations> {
  const result: StoryboardWithAssociations = { ...sb }

  if (sb.scene_variant_id) {
    const sv = await getDb()('scene_variants')
      .join('scenes', 'scenes.id', 'scene_variants.scene_id')
      .where('scene_variants.id', sb.scene_variant_id)
      .select('scene_variants.id', 'scene_variants.name', 'scene_variants.scene_id', 'scenes.name as scene_name')
      .first()
    result.scene_variant = sv || null
  } else {
    result.scene_variant = null
  }

  result.character_looks = await StoryboardCharacterLookModel.findByStoryboard(sb.id)
  result.prop_variants = await StoryboardPropVariantModel.findByStoryboard(sb.id)

  return result
}

export const StoryboardService = {
  async list(projectId: string, episodeNum: number, userId: string): Promise<StoryboardWithAssociations[]> {
    const episode = await getEpisodeByNum(projectId, episodeNum, userId)
    const storyboards = await StoryboardModel.findByEpisode(episode.id)
    return Promise.all(storyboards.map(enrichWithAssociations))
  },

  async get(projectId: string, episodeNum: number, storyboardId: string, userId: string): Promise<Storyboard> {
    const episode = await getEpisodeByNum(projectId, episodeNum, userId)
    const sb = await StoryboardModel.findById(storyboardId)
    if (!sb || sb.episode_id !== episode.id) notFoundError('分镜不存在')
    return sb
  },

  async getWithAssociations(projectId: string, episodeNum: number, storyboardId: string, userId: string): Promise<StoryboardWithAssociations> {
    const sb = await this.get(projectId, episodeNum, storyboardId, userId)
    return enrichWithAssociations(sb)
  },

  async create(projectId: string, episodeNum: number, input: CreateStoryboardInput, userId: string): Promise<StoryboardWithAssociations> {
    const episode = await getEpisodeByNum(projectId, episodeNum, userId)
    if (input.scene_variant_id) {
      const sv = await getDb()('scene_variants').where({ id: input.scene_variant_id }).first()
      if (sv) input.scene_id = sv.scene_id
    }
    const sb = await StoryboardModel.create(episode.id, input)
    await syncAssociations(sb.id, input)
    return enrichWithAssociations(sb)
  },

  async update(projectId: string, episodeNum: number, storyboardId: string, data: Partial<CreateStoryboardInput> & { is_active?: boolean }, userId: string): Promise<StoryboardWithAssociations> {
    await this.get(projectId, episodeNum, storyboardId, userId)
    if (data.scene_variant_id) {
      const sv = await getDb()('scene_variants').where({ id: data.scene_variant_id }).first()
      if (sv) data.scene_id = sv.scene_id
    }
    const updated = await StoryboardModel.update(storyboardId, data)
    if (!updated) notFoundError('更新失败')
    await syncAssociations(storyboardId, data as CreateStoryboardInput)
    return enrichWithAssociations(updated)
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

  async findByCharacter(projectId: string, characterId: string, userId: string): Promise<Storyboard[]> {
    await ProjectService.getProject(projectId, userId)
    const sbIds = await StoryboardCharacterLookModel.findStoryboardsByCharacter(characterId)
    if (!sbIds.length) return []
    return getDb()('storyboards')
      .whereIn('id', sbIds)
      .andWhere('is_active', true)
      .orderBy('sequence_number', 'asc')
  },

  async findByScene(projectId: string, sceneId: string, userId: string): Promise<Storyboard[]> {
    await ProjectService.getProject(projectId, userId)
    return getDb()('storyboards')
      .where('is_active', true)
      .where(function () {
        this.where('scene_id', sceneId)
          .orWhereIn('scene_variant_id',
            getDb()('scene_variants').where('scene_id', sceneId).select('id'),
          )
      })
      .orderBy('sequence_number', 'asc')
  },

  async findByProp(projectId: string, propId: string, userId: string): Promise<Storyboard[]> {
    await ProjectService.getProject(projectId, userId)
    const sbIds = await StoryboardPropVariantModel.findStoryboardsByProp(propId)
    if (!sbIds.length) return []
    return getDb()('storyboards')
      .whereIn('id', sbIds)
      .andWhere('is_active', true)
      .orderBy('sequence_number', 'asc')
  },
}
