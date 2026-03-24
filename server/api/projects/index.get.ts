import { ProjectService } from '~/core/services/project.service'
import { calcProjectProgress } from '~~/server/utils/calcProjectProgress'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projects = await ProjectService.getUserProjects(userId)

  const query = getQuery(event)
  const includeProgress = (query.include as string || '').split(',').includes('progress')

  if (includeProgress) {
    const results = await Promise.all(
      projects.map(async (p) => ({
        ...p,
        progress: await calcProjectProgress(p.id, p.total_episodes),
      })),
    )
    return ok(results)
  }

  return ok(projects)
})
