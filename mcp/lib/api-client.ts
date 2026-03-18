const BASE_URL = process.env.DRAMA_API_URL || 'http://localhost:3002'
const TOKEN = process.env.DRAMA_API_TOKEN || ''

interface ApiResponse<T> {
  success: boolean
  data: T
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const url = `${BASE_URL}${path}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`

  const init: RequestInit = { method, headers }
  if (body !== undefined) init.body = JSON.stringify(body)

  const res = await fetch(url, init)
  const json = (await res.json()) as ApiResponse<T> | { error: true; statusMessage: string }

  if (!res.ok || 'error' in json) {
    const msg = 'statusMessage' in json ? json.statusMessage : `HTTP ${res.status}`
    throw new Error(`API Error [${res.status}]: ${msg}`)
  }

  return (json as ApiResponse<T>).data
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
}
