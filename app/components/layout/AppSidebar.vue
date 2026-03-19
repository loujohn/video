<script setup lang="ts">
import { Home, Film, Users, Clapperboard, ChevronLeft, ChevronRight, Shield } from 'lucide-vue-next'

const collapsed = ref(false)
const route = useRoute()
const { user } = useAuth()

const navItems = computed(() => {
  const items = [
    { label: '仪表盘', icon: Home, to: '/' },
    { label: '项目', icon: Clapperboard, to: '/projects' },
    { label: '团队', icon: Users, to: '/teams' },
  ]
  if (user.value?.role === 'admin') {
    items.push({ label: '管理', icon: Shield, to: '/admin' })
  }
  return items
})

function isActive(to: string) {
  return route.path === to || (to !== '/' && route.path.startsWith(to + '/'))
}
</script>

<template>
  <aside
    :class="[
      'h-screen bg-white border-r border-zinc-200/80 transition-all duration-300 flex flex-col shadow-sm',
      collapsed ? 'w-[68px]' : 'w-64',
    ]"
  >
    <div class="flex items-center gap-3 px-4 h-16 border-b border-zinc-100">
      <div class="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shrink-0">
        <Film class="h-4 w-4 text-white" />
      </div>
      <span v-if="!collapsed" class="text-base font-bold tracking-tight text-zinc-900">Drama Studio</span>
      <button
        v-if="!collapsed"
        class="ml-auto p-1 rounded-md hover:bg-zinc-100 text-zinc-400 transition-colors"
        @click="collapsed = !collapsed"
      >
        <ChevronLeft class="h-4 w-4" />
      </button>
    </div>

    <nav class="flex-1 p-3 space-y-1">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :class="[
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200',
          isActive(item.to)
            ? 'bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 shadow-sm shadow-indigo-100/50'
            : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50',
        ]"
      >
        <component
          :is="item.icon"
          :class="['h-[18px] w-[18px] shrink-0', isActive(item.to) ? 'text-indigo-600' : '']"
        />
        <span v-if="!collapsed">{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <div v-if="collapsed" class="p-3 border-t border-zinc-100">
      <button
        class="w-full p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 transition-colors flex items-center justify-center"
        @click="collapsed = !collapsed"
      >
        <ChevronRight class="h-4 w-4" />
      </button>
    </div>
  </aside>
</template>
