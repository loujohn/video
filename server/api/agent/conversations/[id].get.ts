import { getDb } from '~/core/db'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const convId = getRouterParam(event, 'id')
  const db = getDb()

  const conv = await db('agent_conversations')
    .where({ id: convId, user_id: userId })
    .first()

  if (!conv) {
    throw createError({ statusCode: 404, message: '对话不存在' })
  }

  const messages = await db('agent_messages')
    .where({ conversation_id: convId })
    .orderBy('sort_order', 'asc')
    .select('id', 'role', 'content', 'tool_calls', 'created_at')

  return {
    success: true,
    data: {
      ...conv,
      messages: messages.map(m => ({
        ...m,
        tool_calls: m.tool_calls ? (typeof m.tool_calls === 'string' ? JSON.parse(m.tool_calls) : m.tool_calls) : [],
      })),
    },
  }
})
