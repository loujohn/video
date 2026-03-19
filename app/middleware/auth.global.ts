export default defineNuxtRouteMiddleware(async (to) => {
  const { isLoggedIn, fetchUser, user } = useAuth()
  const publicPages = ['/login', '/register']

  if (!isLoggedIn.value) {
    await fetchUser()
  }

  if (!isLoggedIn.value && !publicPages.includes(to.path)) {
    return navigateTo('/login')
  }

  if (isLoggedIn.value && publicPages.includes(to.path)) {
    return navigateTo('/')
  }

  if (isLoggedIn.value && to.path.startsWith('/admin') && user.value?.role !== 'admin') {
    return navigateTo('/')
  }
})
