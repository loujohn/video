import { ProjectService } from '~/core/services/project.service'
import { calcProjectProgress } from '~~/server/utils/calcProjectProgress'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const project = await ProjectService.getProject(projectId, userId)
  const progress = await calcProjectProgress(project.id, project.total_episodes)
  return ok({ ...project, progress })
})
