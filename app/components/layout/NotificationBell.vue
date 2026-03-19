<script setup lang="ts">
import { Bell, MessageSquare, AtSign, Reply, CheckCircle, ExternalLink } from 'lucide-vue-next'
import type { NotificationType } from '~/core/types'

const { unreadCount, notifications, fetchNotifications, markRead, markAllRead, startPolling, stopPolling } = useNotifications()

const isOpen = ref(false)

const typeIcons: Record<NotificationType, any> = {
  comment: MessageSquare,
  mention: AtSign,
  reply: Reply,
  status_change: CheckCircle,
}

async function handleClick(n: typeof notifications.value[0]) {
  if (!n.is_read) await markRead(n.id)
  isOpen.value = false
  if (n.link) navigateTo(n.link)
}

async function toggleDropdown() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    await fetchNotifications(10)
  }
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.notification-bell-wrapper')) {
    isOpen.value = false
  }
}

onMounted(() => {
  startPolling()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  stopPolling()
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="relative notification-bell-wrapper">
    <button
      class="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 transition-colors relative"
      @click="toggleDropdown"
    >
      <Bell class="h-[18px] w-[18px]" />
      <span
        v-if="unreadCount > 0"
        class="absolute top-1 right-1 h-4 min-w-4 flex items-center justify-center rounded-full bg-indigo-500 text-[10px] text-white font-medium px-1"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-zinc-200/60 shadow-lg z-50 overflow-hidden"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
          <h3 class="text-sm font-semibold text-zinc-800">通知</h3>
          <button
            v-if="unreadCount > 0"
            class="text-[10px] text-indigo-600 hover:text-indigo-700 font-medium"
            @click="markAllRead"
          >
            全部标记已读
          </button>
        </div>

        <!-- Notification list -->
        <div class="max-h-80 overflow-y-auto">
          <div
            v-for="n in notifications"
            :key="n.id"
            class="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors"
            :class="n.is_read ? 'hover:bg-zinc-50/50' : 'bg-indigo-50/30 hover:bg-indigo-50/50'"
            @click="handleClick(n)"
          >
            <div
              class="h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              :class="n.is_read ? 'bg-zinc-100' : 'bg-indigo-100'"
            >
              <component
                :is="typeIcons[n.type as NotificationType] || MessageSquare"
                class="h-3.5 w-3.5"
                :class="n.is_read ? 'text-zinc-400' : 'text-indigo-600'"
              />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs leading-relaxed" :class="n.is_read ? 'text-zinc-500' : 'text-zinc-800 font-medium'">
                {{ n.title }}
              </p>
              <p v-if="n.content" class="text-[10px] text-zinc-400 mt-0.5 truncate">{{ n.content }}</p>
              <p class="text-[10px] text-zinc-300 mt-1">{{ formatTime(n.created_at) }}</p>
            </div>
            <ExternalLink v-if="n.link" class="h-3 w-3 text-zinc-300 shrink-0 mt-1" />
          </div>

          <div v-if="!notifications.length" class="py-8 text-center">
            <Bell class="h-6 w-6 text-zinc-200 mx-auto mb-1" />
            <p class="text-xs text-zinc-400">暂无通知</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="border-t border-zinc-100 px-4 py-2">
          <NuxtLink
            to="/notifications"
            class="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            @click="isOpen = false"
          >
            查看全部
          </NuxtLink>
        </div>
      </div>
    </Transition>
  </div>
</template>
