import { ProjectService } from '~/core/services/project.service'
export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projects = await ProjectService.getUserProjects(userId)
  return ok(projects)
})
