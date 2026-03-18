import { ProjectService } from '~/core/services/project.service'
import { ok, badRequest } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const body = await readBody(event)

  if (!body.team_id || !body.title) badRequest('team_id, title 必填')

  const project = await ProjectService.createProject(body, userId)
  return ok(project)
})
