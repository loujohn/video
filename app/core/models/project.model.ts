import { getDb } from '../db'
import type { Project, CreateProjectInput, UpdateProjectInput } from '../types'

const TABLE = 'projects'

export const ProjectModel = {
  async findById(id: string): Promise<Project | undefined> {
    return getDb()(TABLE).where({ id }).first()
  },

  async findByTeam(teamId: string): Promise<Project[]> {
    return getDb()(TABLE).where({ team_id: teamId }).orderBy('updated_at', 'desc')
  },

  async findByUser(userId: string): Promise<Project[]> {
    return getDb()(TABLE)
      .join('team_members', `${TABLE}.team_id`, 'team_members.team_id')
      .where('team_members.user_id', userId)
      .select(`${TABLE}.*`)
      .orderBy(`${TABLE}.updated_at`, 'desc')
  },

  async create(input: CreateProjectInput, userId: string): Promise<Project> {
    const [project] = await getDb()(TABLE)
      .insert({
        team_id: input.team_id,
        title: input.title,
        genre: JSON.stringify(input.genre || []),
        audience: input.audience || null,
        tone: input.tone || null,
        ending_type: input.ending_type || null,
        total_episodes: input.total_episodes || 60,
        language: input.language || 'zh-CN',
        mode: input.mode || 'domestic',
        created_by: userId,
      })
      .returning('*')
    return project
  },

  async update(id: string, data: UpdateProjectInput): Promise<Project | undefined> {
    const updateData: Record<string, unknown> = { updated_at: new Date() }
    if (data.title !== undefined) updateData.title = data.title
    if (data.genre !== undefined) updateData.genre = JSON.stringify(data.genre)
    if (data.audience !== undefined) updateData.audience = data.audience
    if (data.tone !== undefined) updateData.tone = data.tone
    if (data.ending_type !== undefined) updateData.ending_type = data.ending_type
    if (data.total_episodes !== undefined) updateData.total_episodes = data.total_episodes
    if (data.language !== undefined) updateData.language = data.language
    if (data.mode !== undefined) updateData.mode = data.mode
    if (data.status !== undefined) updateData.status = data.status

    const [project] = await getDb()(TABLE)
      .where({ id })
      .update(updateData)
      .returning('*')
    return project
  },

  async delete(id: string): Promise<boolean> {
    const count = await getDb()(TABLE).where({ id }).del()
    return count > 0
  },
}
