import { getDb } from '~/core/db'
import { ProjectService } from '~/core/services/project.service'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const format = getQuery(event).format as string || 'json'

  const project = await ProjectService.getProject(projectId, userId)
  const db = getDb()

  const episodes = await db('episodes').where({ project_id: projectId }).orderBy('episode_number', 'asc')
  const characters = await db('characters').where({ project_id: projectId, is_active: true }).orderBy('name', 'asc')
  const scenes = await db('scenes').where({ project_id: projectId, is_active: true }).orderBy('name', 'asc')
  const props = await db('props').where({ project_id: projectId, is_active: true }).orderBy('name', 'asc')
  const relations = await db('character_relations').where({ project_id: projectId })
  const plan = await db('creative_plans').where({ project_id: projectId }).first()

  const episodeData = []
  for (const ep of episodes) {
    const script = await db('episode_scripts')
      .where({ episode_id: ep.id })
      .orderBy('version', 'desc')
      .first()
    const storyboards = await db('storyboards')
      .where({ episode_id: ep.id, is_active: true })
      .orderBy('sequence_number', 'asc')
    episodeData.push({
      ...ep,
      script: script?.content || null,
      storyboards,
    })
  }

  if (format === 'markdown') {
    let md = `# ${project.title}\n\n`
    if (project.genre?.length) md += `**类型**: ${project.genre.join(', ')}\n`
    if (project.audience) md += `**受众**: ${project.audience}\n`
    if (project.tone) md += `**风格**: ${project.tone}\n`
    md += `\n---\n\n`

    if (plan) {
      md += `## 创作方案\n\n${typeof plan.content === 'string' ? plan.content : JSON.stringify(plan.content, null, 2)}\n\n---\n\n`
    }

    if (characters.length) {
      md += `## 角色 (${characters.length})\n\n`
      for (const c of characters) {
        md += `### ${c.name}`
        if (c.age) md += ` (${c.age}岁)`
        md += `\n`
        if (c.appearance) md += `- **外貌**: ${c.appearance}\n`
        if (c.personality_tags?.length) md += `- **性格**: ${c.personality_tags.join(', ')}\n`
        if (c.public_identity) md += `- **公开身份**: ${c.public_identity}\n`
        if (c.real_identity) md += `- **真实身份**: ${c.real_identity}\n`
        if (c.motivation) md += `- **动机**: ${c.motivation}\n`
        md += `\n`
      }
      md += `---\n\n`
    }

    if (relations.length) {
      md += `## 角色关系\n\n`
      const charMap = Object.fromEntries(characters.map(c => [c.id, c.name]))
      for (const r of relations) {
        md += `- ${charMap[r.from_character_id] || '?'} → **${r.relation_type}** → ${charMap[r.to_character_id] || '?'}`
        if (r.description) md += ` (${r.description})`
        md += `\n`
      }
      md += `\n---\n\n`
    }

    if (scenes.length) {
      md += `## 场景 (${scenes.length})\n\n`
      for (const s of scenes) {
        md += `### ${s.name}\n`
        if (s.description) md += `${s.description}\n`
        md += `\n`
      }
      md += `---\n\n`
    }

    for (const ep of episodeData) {
      md += `## 第${ep.episode_number}集: ${ep.title || '无标题'}\n\n`
      if (ep.synopsis) md += `> ${ep.synopsis}\n\n`
      if (ep.script) md += `### 剧本\n\n${ep.script}\n\n`
      if (ep.storyboards.length) {
        md += `### 分镜 (${ep.storyboards.length})\n\n`
        for (const sb of ep.storyboards) {
          md += `**#${String(sb.sequence_number).padStart(2, '0')}**`
          if (sb.shot_type) md += ` [${sb.shot_type}]`
          if (sb.duration_seconds) md += ` ${sb.duration_seconds}s`
          md += `\n`
          if (sb.description) md += `${sb.description}\n`
          if (sb.dialogue) md += `台词：「${sb.dialogue}」\n`
          if (sb.action_direction) md += `动作：${sb.action_direction}\n`
          md += `\n`
        }
      }
      md += `---\n\n`
    }

    setResponseHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
    setResponseHeader(event, 'Content-Disposition', `attachment; filename="${encodeURIComponent(project.title)}.md"`)
    return md
  }

  return ok({
    project,
    creative_plan: plan?.content || null,
    characters,
    character_relations: relations,
    scenes,
    props,
    episodes: episodeData,
  })
})
