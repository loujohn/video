export default defineNuxtRouteMiddleware(async (to) => {
  const { isLoggedIn, fetchUser } = useAuth()
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
})
