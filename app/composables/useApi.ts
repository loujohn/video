export function useApi() {
  const token = useCookie('token')

  async function $api<T>(url: string, options: Record<string, any> = {}): Promise<T> {
    const headers: Record<string, string> = {}
    if (token.value) {
      headers['Authorization'] = `Bearer ${token.value}`
    }

    try {
      const res = await $fetch<{ success: boolean; data: T }>(url, {
        ...options,
        headers: { ...headers, ...options.headers },
        retry: options.retry ?? 1,
        retryDelay: 1000,
        timeout: options.timeout ?? 30_000,
      })
      return res.data
    } catch (error: any) {
      if (error?.response?.status === 401 || error?.statusCode === 401) {
        token.value = null
        if (import.meta.client) {
          navigateTo('/login')
        }
      }
      throw error
    }
  }

  return { $api }
}
