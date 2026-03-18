import { getRouterParam } from 'h3'
import { EpisodeModel } from '~/core/models/episode.model'
import { StoryboardModel } from '~/core/models/storyboard.model'
import { SceneModel } from '~/core/models/scene.model'
import { ProjectService } from '~/core/services/project.service'
import { notFoundError, badRequestError } from '~/core/errors'
import { ok } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const num = Number(getRouterParam(event, 'num'))
  if (!Number.isInteger(num) || num < 1) badRequestError('无效的集号')

  await ProjectService.getProject(projectId, userId)
  const episode = await EpisodeModel.findByNumber(projectId, num)
  if (!episode) notFoundError('分集未找到')

  const storyboards = await StoryboardModel.findByEpisode(episode.id)
  const scenes = await SceneModel.findByProject(projectId)
  const sceneMap = Object.fromEntries(scenes.map((s) => [s.id, s]))

  const data = storyboards.map((sb) => ({
    ...sb,
    scene_name: sb.scene_id ? sceneMap[sb.scene_id]?.name ?? null : null,
  }))

  return ok({ episode, storyboards: data })
})
