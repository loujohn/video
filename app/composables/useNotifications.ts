import type { NotificationWithActor } from '~/core/types'

const POLL_INTERVAL = 30000

export function useNotifications() {
  const { $api } = useApi()
  const { isLoggedIn } = useAuth()

  const unreadCount = useState<number>('notification-unread-count', () => 0)
  const notifications = useState<NotificationWithActor[]>('notification-list', () => [])
  const loading = ref(false)

  let timer: ReturnType<typeof setInterval> | null = null

  async function fetchUnreadCount() {
    if (!isLoggedIn.value) return
    try {
      const res = await $api<{ unread_count: number }>('/api/notifications?limit=0')
      unreadCount.value = res.unread_count
    } catch {}
  }

  async function fetchNotifications(limit = 10) {
    if (!isLoggedIn.value) return
    loading.value = true
    try {
      const res = await $api<{ notifications: NotificationWithActor[]; unread_count: number }>(`/api/notifications?limit=${limit}`)
      notifications.value = res.notifications
      unreadCount.value = res.unread_count
    } catch {} finally {
      loading.value = false
    }
  }

  async function markRead(notificationId: string) {
    try {
      await $api(`/api/notifications/${notificationId}/read`, { method: 'PUT' })
      const n = notifications.value.find(n => n.id === notificationId)
      if (n && !n.is_read) {
        n.is_read = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch {}
  }

  async function markAllRead() {
    try {
      await $api('/api/notifications/read-all', { method: 'PUT' })
      for (const n of notifications.value) n.is_read = true
      unreadCount.value = 0
    } catch {}
  }

  function startPolling() {
    stopPolling()
    fetchUnreadCount()
    timer = setInterval(fetchUnreadCount, POLL_INTERVAL)

    if (import.meta.client) {
      document.addEventListener('visibilitychange', onVisibilityChange)
    }
  }

  function stopPolling() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    if (import.meta.client) {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }

  function onVisibilityChange() {
    if (document.hidden) {
      if (timer) { clearInterval(timer); timer = null }
    } else {
      fetchUnreadCount()
      timer = setInterval(fetchUnreadCount, POLL_INTERVAL)
    }
  }

  return {
    unreadCount,
    notifications,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markRead,
    markAllRead,
    startPolling,
    stopPolling,
  }
}
