import { getDb } from '~/core/db'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const db = getDb()

  const conversations = await db('agent_conversations')
    .where({ user_id: userId })
    .orderBy('updated_at', 'desc')
    .limit(50)
    .select('id', 'title', 'project_id', 'skill_id', 'created_at', 'updated_at')

  return { success: true, data: conversations }
})
