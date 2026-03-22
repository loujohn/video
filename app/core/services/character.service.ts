import { CharacterModel } from '../models/character.model'
import { CharacterLookService } from './character-look.service'
import { ProjectService } from './project.service'
import { notFoundError } from '../errors'
import type { Character, CreateCharacterInput, CharacterRelation } from '../types'

export const CharacterService = {
  async list(projectId: string, userId: string): Promise<Character[]> {
    await ProjectService.getProject(projectId, userId)
    return CharacterModel.findByProject(projectId)
  },

  async get(projectId: string, characterId: string, userId: string): Promise<Character> {
    await ProjectService.getProject(projectId, userId)
    const character = await CharacterModel.findById(characterId)
    if (!character || character.project_id !== projectId) notFoundError('角色不存在')
    return character
  },

  async create(projectId: string, input: CreateCharacterInput, userId: string): Promise<Character> {
    await ProjectService.getProject(projectId, userId)
    const character = await CharacterModel.create(projectId, input)
    try {
      await CharacterLookService.createBaseLook(character.id, input.image_prompt)
    } catch (e) {
      await CharacterModel.delete(character.id)
      throw e
    }
    return character
  },

  async update(projectId: string, characterId: string, data: Partial<CreateCharacterInput> & { is_active?: boolean }, userId: string): Promise<Character> {
    await ProjectService.getProject(projectId, userId)
    const character = await CharacterModel.findById(characterId)
    if (!character || character.project_id !== projectId) notFoundError('角色不存在')
    const updated = await CharacterModel.update(characterId, data)
    if (!updated) notFoundError('更新失败')
    return updated
  },

  async delete(projectId: string, characterId: string, userId: string): Promise<void> {
    await ProjectService.getProject(projectId, userId)
    const character = await CharacterModel.findById(characterId)
    if (!character || character.project_id !== projectId) notFoundError('角色不存在')
    await CharacterModel.delete(characterId)
  },

  async getRelations(projectId: string, userId: string): Promise<CharacterRelation[]> {
    await ProjectService.getProject(projectId, userId)
    return CharacterModel.getRelations(projectId)
  },

  async setRelations(projectId: string, relations: Array<{ from_character_id: string; to_character_id: string; relation_type: string; description?: string }>, userId: string): Promise<CharacterRelation[]> {
    await ProjectService.getProject(projectId, userId)
    const valid = relations.filter(r => r.from_character_id && r.to_character_id && r.relation_type)
    return CharacterModel.setRelations(projectId, valid)
  },
}
