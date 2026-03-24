import { getDb } from '~/core/db'
import type { ProjectProgress } from '~/core/types/project'

export async function calcProjectProgress(
  projectId: string,
  totalEpisodes: number,
): Promise<ProjectProgress> {
  const db = getDb()

  const plan = await db('creative_plans').where({ project_id: projectId }).first()
  const hasPlan = !!plan

  const charStats = await db('characters')
    .where({ project_id: projectId, is_active: true })
    .select(
      db.raw('count(*) as total'),
      db.raw('count(CASE WHEN id IN (SELECT DISTINCT character_id FROM character_looks WHERE is_active = true) THEN 1 END) as wl'),
    )
    .first()

  const sceneStats = await db('scenes')
    .where({ project_id: projectId, is_active: true })
    .count('id as count')
    .first()

  const epStats = await db('episodes')
    .where({ project_id: projectId })
    .select(
      db.raw('count(*) as created'),
      db.raw("count(CASE WHEN status = 'written' THEN 1 END) as written"),
      db.raw("count(CASE WHEN status = 'writing' THEN 1 END) as writing"),
    )
    .first()

  const sbStats = await db('storyboards')
    .join('episodes', 'storyboards.episode_id', 'episodes.id')
    .where({ 'episodes.project_id': projectId, 'storyboards.is_active': true })
    .select(
      db.raw('count(*) as total'),
      db.raw('count(storyboards.image_prompt) as wip'),
      db.raw('count(storyboards.video_prompt) as wvp'),
    )
    .first()

  const imgStats = await db('storyboards')
    .join('episodes', 'storyboards.episode_id', 'episodes.id')
    .where({ 'episodes.project_id': projectId, 'storyboards.is_active': true })
    .select(
      db.raw(`count(DISTINCT CASE WHEN storyboards.id IN (
        SELECT linked_entity_id FROM assets WHERE linked_entity_type = 'storyboard' AND type = 'image' AND is_active = true
      ) THEN storyboards.id END) as wi`),
      db.raw(`count(DISTINCT CASE WHEN storyboards.id IN (
        SELECT linked_entity_id FROM assets WHERE linked_entity_type = 'storyboard' AND type = 'image' AND is_active = true AND metadata::text LIKE '%"review_status":"approved"%'
      ) THEN storyboards.id END) as approved`),
    )
    .first()

  const charTotal = Number(charStats?.total || 0)
  const charWithLooks = Number(charStats?.wl || 0)
  const sceneTotal = Number(sceneStats?.count || 0)
  const epCreated = Number(epStats?.created || 0)
  const epWritten = Number(epStats?.written || 0)
  const epWriting = Number(epStats?.writing || 0)
  const sbTotal = Number(sbStats?.total || 0)
  const sbWithImagePrompt = Number(sbStats?.wip || 0)
  const sbWithVideoPrompt = Number(sbStats?.wvp || 0)
  const imgWithImages = Number(imgStats?.wi || 0)
  const imgApproved = Number(imgStats?.approved || 0)

  const te = totalEpisodes || 1
  const expectedSb = te * 6
  const sbBase = sbTotal || expectedSb

  const weights = [
    { pct: hasPlan ? 100 : 0, w: 5 },
    { pct: charTotal > 0 ? (charWithLooks / charTotal) * 100 : 0, w: 10 },
    { pct: sceneTotal > 0 ? 100 : 0, w: 5 },
    { pct: (epWritten / te) * 100, w: 20 },
    { pct: Math.min((sbTotal / expectedSb) * 100, 100), w: 20 },
    { pct: sbBase > 0 ? (imgWithImages / sbBase) * 100 : 0, w: 25 },
    { pct: sbBase > 0 ? (imgApproved / sbBase) * 100 : 0, w: 15 },
  ]

  const overall = Math.round(weights.reduce((s, { pct, w }) => s + (pct * w) / 100, 0))

  return {
    overall_percent: Math.min(overall, 100),
    creative_plan: hasPlan,
    characters: { total: charTotal, with_looks: charWithLooks },
    scenes: { total: sceneTotal },
    episodes: { total: totalEpisodes, created: epCreated, written: epWritten, writing: epWriting },
    storyboards: { total: sbTotal, with_image_prompt: sbWithImagePrompt, with_video_prompt: sbWithVideoPrompt },
    images: { total_storyboards: sbBase, with_images: imgWithImages, approved: imgApproved },
  }
}
