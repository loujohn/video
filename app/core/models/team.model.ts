import { getDb } from '../db'
import type { Team, TeamMember, CreateTeamInput, AddMemberInput } from '../types'

const TEAMS = 'teams'
const MEMBERS = 'team_members'

export const TeamModel = {
  async findById(id: string): Promise<Team | undefined> {
    return getDb()(TEAMS).where({ id }).first()
  },

  async findByUser(userId: string): Promise<Team[]> {
    return getDb()(TEAMS)
      .join(MEMBERS, `${TEAMS}.id`, `${MEMBERS}.team_id`)
      .where(`${MEMBERS}.user_id`, userId)
      .select(`${TEAMS}.*`)
  },

  async create(input: CreateTeamInput, userId: string): Promise<Team> {
    const db = getDb()
    return db.transaction(async (trx) => {
      const [team] = await trx(TEAMS)
        .insert({
          name: input.name,
          description: input.description || null,
          created_by: userId,
        })
        .returning('*')

      await trx(MEMBERS).insert({
        team_id: team.id,
        user_id: userId,
        role: 'owner',
      })

      return team
    })
  },

  async update(id: string, data: Partial<Pick<Team, 'name' | 'description'>>): Promise<Team | undefined> {
    const [team] = await getDb()(TEAMS)
      .where({ id })
      .update({ ...data, updated_at: new Date() })
      .returning('*')
    return team
  },

  async getMembers(teamId: string): Promise<(TeamMember & { user_name: string; user_email: string })[]> {
    return getDb()(MEMBERS)
      .join('users', `${MEMBERS}.user_id`, 'users.id')
      .where(`${MEMBERS}.team_id`, teamId)
      .select(`${MEMBERS}.*`, 'users.name as user_name', 'users.email as user_email')
  },

  async addMember(teamId: string, input: AddMemberInput): Promise<TeamMember> {
    const [member] = await getDb()(MEMBERS)
      .insert({
        team_id: teamId,
        user_id: input.user_id,
        role: input.role || 'editor',
      })
      .returning('*')
    return member
  },

  async isMember(teamId: string, userId: string): Promise<boolean> {
    const row = await getDb()(MEMBERS)
      .where({ team_id: teamId, user_id: userId })
      .first()
    return !!row
  },

  async getMemberRole(teamId: string, userId: string): Promise<string | null> {
    const row = await getDb()(MEMBERS)
      .where({ team_id: teamId, user_id: userId })
      .select('role')
      .first()
    return row?.role || null
  },
}
