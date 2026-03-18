export function useApi() {
  const token = useCookie('token')

  async function $api<T>(url: string, options: Record<string, any> = {}): Promise<T> {
    const headers: Record<string, string> = {}
    if (token.value) {
      headers['Authorization'] = `Bearer ${token.value}`
    }

    const res = await $fetch<{ success: boolean; data: T }>(url, {
      ...options,
      headers: { ...headers, ...options.headers },
    })
    return res.data
  }

  return { $api }
}
