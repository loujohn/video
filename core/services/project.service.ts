import { ProjectModel } from '../models/project.model'
import { TeamModel } from '../models/team.model'
import { notFoundError, forbiddenError } from '../errors'
import type { Project, CreateProjectInput, UpdateProjectInput } from '../types'

export const ProjectService = {
  async getUserProjects(userId: string): Promise<Project[]> {
    return ProjectModel.findByUser(userId)
  },

  async getProject(projectId: string, userId: string): Promise<Project> {
    const project = await ProjectModel.findById(projectId)
    if (!project) notFoundError('项目不存在')

    const isMember = await TeamModel.isMember(project.team_id, userId)
    if (!isMember) forbiddenError('无权访问该项目')

    return project
  },

  async createProject(input: CreateProjectInput, userId: string): Promise<Project> {
    const isMember = await TeamModel.isMember(input.team_id, userId)
    if (!isMember) forbiddenError('无权在该团队创建项目')

    return ProjectModel.create(input, userId)
  },

  async updateProject(projectId: string, data: UpdateProjectInput, userId: string): Promise<Project> {
    const project = await ProjectModel.findById(projectId)
    if (!project) notFoundError('项目不存在')

    const isMember = await TeamModel.isMember(project.team_id, userId)
    if (!isMember) forbiddenError('无权修改该项目')

    const updated = await ProjectModel.update(projectId, data)
    if (!updated) notFoundError('更新失败')
    return updated
  },
}
