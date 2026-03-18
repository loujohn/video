import { TeamModel } from '../models/team.model'
import type { CreateTeamInput, AddMemberInput, Team, TeamMember } from '../types'

export const TeamService = {
  async getUserTeams(userId: string): Promise<Team[]> {
    return TeamModel.findByUser(userId)
  },

  async getTeam(teamId: string, userId: string): Promise<Team> {
    const isMember = await TeamModel.isMember(teamId, userId)
    if (!isMember) throw new Error('无权访问该团队')

    const team = await TeamModel.findById(teamId)
    if (!team) throw new Error('团队不存在')
    return team
  },

  async createTeam(input: CreateTeamInput, userId: string): Promise<Team> {
    return TeamModel.create(input, userId)
  },

  async updateTeam(teamId: string, data: Partial<Pick<Team, 'name' | 'description'>>, userId: string): Promise<Team> {
    const role = await TeamModel.getMemberRole(teamId, userId)
    if (role !== 'owner') throw new Error('仅团队所有者可修改团队信息')

    const team = await TeamModel.update(teamId, data)
    if (!team) throw new Error('团队不存在')
    return team
  },

  async getMembers(teamId: string, userId: string) {
    const isMember = await TeamModel.isMember(teamId, userId)
    if (!isMember) throw new Error('无权访问该团队')
    return TeamModel.getMembers(teamId)
  },

  async addMember(teamId: string, input: AddMemberInput, userId: string): Promise<TeamMember> {
    const role = await TeamModel.getMemberRole(teamId, userId)
    if (role !== 'owner') throw new Error('仅团队所有者可添加成员')
    return TeamModel.addMember(teamId, input)
  },
}
