import { getDb } from '~/core/db'
import { calcProjectProgress } from '~~/server/utils/calcProjectProgress'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const db = getDb()

  const teamIds = await db('team_members')
    .where({ user_id: userId })
    .select('team_id')
    .then(rows => rows.map(r => r.team_id))

  if (!teamIds.length) {
    return ok({
      projects: { total: 0, by_status: {} },
      episodes: { total: 0 },
      characters: { total: 0 },
      scenes: { total: 0 },
      storyboards: { total: 0, with_image_prompt: 0, with_video_prompt: 0 },
      recent_activity: [],
    })
  }

  const projectIds = await db('projects')
    .whereIn('team_id', teamIds)
    .select('id', 'status')

  const pids = projectIds.map(p => p.id)
  const statusCounts: Record<string, number> = {}
  for (const p of projectIds) {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1
  }

  if (!pids.length) {
    return ok({
      projects: { total: 0, by_status: statusCounts },
      episodes: { total: 0 },
      characters: { total: 0 },
      scenes: { total: 0 },
      storyboards: { total: 0, with_image_prompt: 0, with_video_prompt: 0 },
      recent_activity: [],
    })
  }

  const [episodeCount] = await db('episodes').whereIn('project_id', pids).count('id as count')
  const [characterCount] = await db('characters').whereIn('project_id', pids).where('is_active', true).count('id as count')
  const [sceneCount] = await db('scenes').whereIn('project_id', pids).where('is_active', true).count('id as count')

  const storyboardStats = await db('storyboards')
    .join('episodes', 'storyboards.episode_id', 'episodes.id')
    .whereIn('episodes.project_id', pids)
    .where('storyboards.is_active', true)
    .select(
      db.raw('count(*) as total'),
      db.raw('count(storyboards.image_prompt) as with_image_prompt'),
      db.raw('count(storyboards.video_prompt) as with_video_prompt'),
    )
    .first()

  const recentProjects = await db('projects')
    .whereIn('id', pids)
    .orderBy('updated_at', 'desc')
    .limit(5)
    .select('id', 'title', 'status', 'genre', 'updated_at', 'total_episodes')

  const recentActivity = []
  for (const project of recentProjects) {
    const epCount = await db('episodes').where('project_id', project.id).count('id as count').first()
    const charCount = await db('characters').where({ project_id: project.id, is_active: true }).count('id as count').first()
    const sbCount = await db('storyboards')
      .join('episodes', 'storyboards.episode_id', 'episodes.id')
      .where('episodes.project_id', project.id)
      .where('storyboards.is_active', true)
      .count('storyboards.id as count')
      .first()

    const progress = await calcProjectProgress(project.id, project.total_episodes || 10)

    recentActivity.push({
      project_id: project.id,
      title: project.title,
      status: project.status,
      genre: project.genre,
      updated_at: project.updated_at,
      episode_count: Number(epCount?.count || 0),
      character_count: Number(charCount?.count || 0),
      storyboard_count: Number(sbCount?.count || 0),
      progress,
    })
  }

  return ok({
    projects: { total: pids.length, by_status: statusCounts },
    episodes: { total: Number(episodeCount?.count || 0) },
    characters: { total: Number(characterCount?.count || 0) },
    scenes: { total: Number(sceneCount?.count || 0) },
    storyboards: {
      total: Number(storyboardStats?.total || 0),
      with_image_prompt: Number(storyboardStats?.with_image_prompt || 0),
      with_video_prompt: Number(storyboardStats?.with_video_prompt || 0),
    },
    recent_activity: recentActivity,
  })
})
