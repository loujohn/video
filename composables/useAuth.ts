import type { UserPublic } from '~/core/types'

export function useAuth() {
  const user = useState<UserPublic | null>('auth-user', () => null)
  const token = useCookie('token')
  const { $api } = useApi()

  async function fetchUser() {
    if (!token.value) {
      user.value = null
      return
    }
    try {
      user.value = await $api<UserPublic>('/api/auth/me')
    } catch {
      user.value = null
      token.value = null
    }
  }

  async function login(email: string, password: string) {
    const res = await $fetch<{ success: boolean; data: { user: UserPublic; token: string } }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    token.value = res.data.token
    user.value = res.data.user
  }

  async function register(name: string, email: string, password: string) {
    const res = await $fetch<{ success: boolean; data: { user: UserPublic; token: string } }>('/api/auth/register', {
      method: 'POST',
      body: { name, email, password },
    })
    token.value = res.data.token
    user.value = res.data.user
  }

  function logout() {
    token.value = null
    user.value = null
    navigateTo('/login')
  }

  const isLoggedIn = computed(() => !!user.value)

  return { user, isLoggedIn, fetchUser, login, register, logout }
}
