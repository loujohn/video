import { getDb } from '~/core/db'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const convId = getRouterParam(event, 'id')
  const db = getDb()

  const deleted = await db('agent_conversations')
    .where({ id: convId, user_id: userId })
    .delete()

  if (!deleted) {
    throw createError({ statusCode: 404, message: '对话不存在' })
  }

  return { success: true }
})
