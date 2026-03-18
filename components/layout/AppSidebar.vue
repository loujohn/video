<script setup lang="ts">
import { Home, Film, Users, ChevronLeft, ChevronRight } from 'lucide-vue-next'

const collapsed = ref(false)
const route = useRoute()

const navItems = [
  { label: '仪表盘', icon: Home, to: '/' },
  { label: '项目', icon: Film, to: '/projects' },
  { label: '团队', icon: Users, to: '/teams' },
]

function isActive(to: string) {
  return route.path === to || (to !== '/' && route.path.startsWith(to + '/'))
}
</script>

<template>
  <aside
    :class="[
      'h-screen border-r border-zinc-200 bg-white transition-all duration-300 flex flex-col',
      collapsed ? 'w-16' : 'w-60',
    ]"
  >
    <div class="flex items-center justify-between p-4 border-b border-zinc-100">
      <span v-if="!collapsed" class="text-lg font-semibold tracking-tight">Drama Studio</span>
      <button
        class="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-500 transition-colors"
        @click="collapsed = !collapsed"
      >
        <component :is="collapsed ? ChevronRight : ChevronLeft" class="h-4 w-4" />
      </button>
    </div>

    <nav class="flex-1 p-2 space-y-1">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :class="[
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          isActive(item.to)
            ? 'bg-zinc-900 text-white'
            : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100',
        ]"
      >
        <component :is="item.icon" class="h-4 w-4 shrink-0" />
        <span v-if="!collapsed">{{ item.label }}</span>
      </NuxtLink>
    </nav>
  </aside>
</template>
