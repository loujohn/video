import { ProjectService } from '~/core/services/project.service'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const project = await ProjectService.getProject(projectId, userId)
  return ok(project)
})
