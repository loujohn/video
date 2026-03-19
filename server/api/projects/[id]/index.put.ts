import { ProjectService } from '~/core/services/project.service'
import { updateProjectSchema } from '~~/server/schemas/project'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const body = await validateBody(event, updateProjectSchema)
  const project = await ProjectService.updateProject(projectId, body, userId)
  return ok(project)
})
