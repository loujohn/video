import { ProjectService } from '~/core/services/project.service'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const body = await readBody(event)

  const project = await ProjectService.updateProject(projectId, body, userId)
  return ok(project)
})
