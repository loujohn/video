export default defineEventHandler((event) => {
  deleteCookie(event, 'token', { path: '/' })
  return ok({ message: '已退出' })
})
