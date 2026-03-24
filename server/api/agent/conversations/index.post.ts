import { getDb } from '~/core/db'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const body = await readBody(event)
  const { title, project_id, skill_id } = body || {}

  const db = getDb()
  const [conv] = await db('agent_conversations')
    .insert({
      user_id: userId,
      title: title || '新对话',
      project_id: project_id || null,
      skill_id: skill_id || 'drama-writer',
    })
    .returning('*')

  return { success: true, data: conv }
})
