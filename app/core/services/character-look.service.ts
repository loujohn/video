import { CharacterLookModel } from '../models/character-look.model'
import { CharacterService } from './character.service'
import { notFoundError } from '../errors'
import type { CharacterLook, CreateCharacterLookInput } from '../types'

export const CharacterLookService = {
  async list(projectId: string, characterId: string, userId: string): Promise<CharacterLook[]> {
    await CharacterService.get(projectId, characterId, userId)
    return CharacterLookModel.findByCharacter(characterId)
  },

  async get(projectId: string, characterId: string, lookId: string, userId: string): Promise<CharacterLook> {
    await CharacterService.get(projectId, characterId, userId)
    const look = await CharacterLookModel.findById(lookId)
    if (!look || look.character_id !== characterId) notFoundError('角色形象不存在')
    return look
  },

  async create(projectId: string, characterId: string, input: CreateCharacterLookInput, userId: string): Promise<CharacterLook> {
    await CharacterService.get(projectId, characterId, userId)
    return CharacterLookModel.create(characterId, input)
  },

  async createBaseLook(characterId: string, imagePrompt?: string | null): Promise<CharacterLook> {
    return CharacterLookModel.create(characterId, {
      name: '基础形象',
      image_prompt: imagePrompt ?? undefined,
      is_base: true,
      sort_order: 0,
    })
  },

  async update(projectId: string, characterId: string, lookId: string, data: Partial<CreateCharacterLookInput> & { is_active?: boolean }, userId: string): Promise<CharacterLook> {
    await CharacterService.get(projectId, characterId, userId)
    const look = await CharacterLookModel.findById(lookId)
    if (!look || look.character_id !== characterId) notFoundError('角色形象不存在')
    const updated = await CharacterLookModel.update(lookId, data)
    if (!updated) notFoundError('更新失败')
    return updated
  },

  async delete(projectId: string, characterId: string, lookId: string, userId: string): Promise<void> {
    await CharacterService.get(projectId, characterId, userId)
    const look = await CharacterLookModel.findById(lookId)
    if (!look || look.character_id !== characterId) notFoundError('角色形象不存在')
    await CharacterLookModel.delete(lookId)
  },
}
