import { ProjectService } from '~/core/services/project.service'
import { createProjectSchema } from '~~/server/schemas/project'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const body = await validateBody(event, createProjectSchema)
  const project = await ProjectService.createProject(body, userId)
  return ok(project)
})
