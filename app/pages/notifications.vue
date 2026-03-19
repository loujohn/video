<script setup lang="ts">
import { Bell, MessageSquare, AtSign, Reply, CheckCircle, ExternalLink, CheckCheck } from 'lucide-vue-next'
import type { NotificationType, NotificationWithActor } from '~/core/types'

const { $api } = useApi()

const filter = ref<'all' | 'unread' | 'comment' | 'mention'>('all')
const page = ref(0)
const pageSize = 20

const { data, refresh, pending } = useAsyncData(
  'notification-center',
  async () => {
    const params = new URLSearchParams()
    params.set('limit', String(pageSize))
    params.set('offset', String(page.value * pageSize))
    if (filter.value === 'unread') params.set('is_read', 'false')
    return $api<{
      notifications: NotificationWithActor[]
      unread_count: number
      total: number
    }>(`/api/notifications?${params.toString()}`)
  },
  { watch: [filter, page] },
)

const notifications = computed(() => {
  const list = data.value?.notifications || []
  if (filter.value === 'comment') return list.filter(n => n.type === 'comment')
  if (filter.value === 'mention') return list.filter(n => n.type === 'mention' || n.type === 'reply')
  return list
})

const { markRead, markAllRead } = useNotifications()

const typeIcons: Record<NotificationType, any> = {
  comment: MessageSquare,
  mention: AtSign,
  reply: Reply,
  status_change: CheckCircle,
}

function formatTime(date: string | Date) {
  const d = new Date(date)
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

async function handleClick(n: NotificationWithActor) {
  if (!n.is_read) {
    await markRead(n.id)
    n.is_read = true
  }
  if (n.link) navigateTo(n.link)
}

async function handleMarkAllRead() {
  await markAllRead()
  await refresh()
}

const filterTabs = [
  { key: 'all', label: '全部' },
  { key: 'unread', label: '未读' },
  { key: 'comment', label: '评论' },
  { key: 'mention', label: '提及' },
] as const

const totalPages = computed(() => Math.ceil((data.value?.total || 0) / pageSize))
</script>

<template>
  <LayoutAppLayout>
    <template #title>通知中心</template>

    <div class="max-w-3xl">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-bold text-zinc-900">通知中心</h2>
          <p class="text-sm text-zinc-500 mt-0.5">
            {{ data?.unread_count || 0 }} 条未读通知
          </p>
        </div>
        <Button
          v-if="data?.unread_count"
          variant="outline"
          size="sm"
          class="gap-2"
          @click="handleMarkAllRead"
        >
          <CheckCheck class="h-3.5 w-3.5" />
          全部标记已读
        </Button>
      </div>

      <!-- Filter tabs -->
      <div class="flex gap-1 mb-6 border-b border-zinc-200">
        <button
          v-for="tab in filterTabs"
          :key="tab.key"
          :class="[
            'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
            filter === tab.key
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300',
          ]"
          @click="filter = tab.key; page = 0"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="pending" class="py-16 text-center text-sm text-zinc-400">加载中...</div>

      <!-- Notification list -->
      <div v-else-if="notifications.length" class="space-y-1">
        <div
          v-for="n in notifications"
          :key="n.id"
          class="flex items-start gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors"
          :class="n.is_read ? 'hover:bg-zinc-50' : 'bg-indigo-50/40 hover:bg-indigo-50/60'"
          @click="handleClick(n)"
        >
          <div
            class="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
            :class="n.is_read ? 'bg-zinc-100' : 'bg-indigo-100'"
          >
            <component
              :is="typeIcons[n.type as NotificationType] || MessageSquare"
              class="h-4 w-4"
              :class="n.is_read ? 'text-zinc-400' : 'text-indigo-600'"
            />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm" :class="n.is_read ? 'text-zinc-500' : 'text-zinc-800 font-medium'">
              {{ n.title }}
            </p>
            <p v-if="n.content" class="text-xs text-zinc-400 mt-0.5 line-clamp-2">{{ n.content }}</p>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-[10px] text-zinc-300">{{ formatTime(n.created_at) }}</span>
              <span v-if="n.actor_name" class="text-[10px] text-zinc-400">来自 {{ n.actor_name }}</span>
            </div>
          </div>
          <ExternalLink v-if="n.link" class="h-3.5 w-3.5 text-zinc-300 shrink-0 mt-1.5" />
        </div>
      </div>

      <!-- Empty state -->
      <CommonEmptyState
        v-else
        :icon="Bell"
        title="暂无通知"
        description="当有新评论、回复或被提及时，你会在这里看到通知"
      />

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-6">
        <Button variant="outline" size="sm" :disabled="page === 0" @click="page--">上一页</Button>
        <span class="text-xs text-zinc-500">{{ page + 1 }} / {{ totalPages }}</span>
        <Button variant="outline" size="sm" :disabled="page >= totalPages - 1" @click="page++">下一页</Button>
      </div>
    </div>
  </LayoutAppLayout>
</template>
