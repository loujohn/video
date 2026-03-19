import { getDb, buildUpdateData } from '../db'
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
    const fields = [
      'title', 'audience', 'tone', 'ending_type',
      'total_episodes', 'language', 'mode', 'status',
    ] as const
    const updateData = buildUpdateData(data, fields)
    if (data.genre !== undefined) {
      updateData.genre = JSON.stringify(data.genre)
    }

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
