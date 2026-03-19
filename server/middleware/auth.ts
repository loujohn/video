export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const path = url.pathname

  if (path.startsWith('/api/auth/')) return
  if (path === '/api/health') return
  if (!path.startsWith('/api/')) return

  const token = getTokenFromEvent(event)
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: '未授权' })
  }

  const payload = await verifyToken(token)
  if (!payload) {
    throw createError({ statusCode: 401, statusMessage: 'Token 无效或已过期' })
  }

  event.context.userId = payload.userId
})
