<script setup lang="ts">
import { Clapperboard, Users as UsersIcon, MapPin, ListOrdered, FileText, FolderOpen } from 'lucide-vue-next'

const props = defineProps<{ projectId: string }>()
const route = useRoute()

const navItems = computed(() => [
  { label: '概览', icon: Clapperboard, to: `/projects/${props.projectId}` },
  { label: '角色', icon: UsersIcon, to: `/projects/${props.projectId}/characters` },
  { label: '场景与道具', icon: MapPin, to: `/projects/${props.projectId}/scenes` },
  { label: '分集', icon: ListOrdered, to: `/projects/${props.projectId}/episodes` },
  { label: '创作方案', icon: FileText, to: `/projects/${props.projectId}/plan` },
  { label: '资源库', icon: FolderOpen, to: `/projects/${props.projectId}/assets` },
])

function isActive(to: string) {
  return route.path === to
}
</script>

<template>
  <nav class="flex gap-1 border-b border-zinc-200 mb-6">
    <NuxtLink
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      :class="[
        'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
        isActive(item.to)
          ? 'border-indigo-600 text-indigo-700'
          : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300',
      ]"
    >
      <component :is="item.icon" class="h-4 w-4" />
      {{ item.label }}
    </NuxtLink>
  </nav>
</template>
