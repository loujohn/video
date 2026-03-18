<script setup lang="ts">
import { Clapperboard } from 'lucide-vue-next'

defineProps<{
  project: {
    id: string
    title: string
    genre: string[]
    status: string
    total_episodes: number
    updated_at: string
  }
}>()

const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-zinc-100 text-zinc-600' },
  in_progress: { label: '进行中', color: 'bg-indigo-50 text-indigo-700' },
  review: { label: '审核中', color: 'bg-amber-50 text-amber-700' },
  completed: { label: '已完成', color: 'bg-emerald-50 text-emerald-700' },
}
</script>

<template>
  <NuxtLink
    :to="`/projects/${project.id}`"
    class="group block bg-white rounded-2xl border border-zinc-200/60 p-5 shadow-sm hover:shadow-md hover:border-indigo-200/60 transition-all duration-200"
  >
    <div class="flex items-start gap-4">
      <div class="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center shrink-0 group-hover:from-indigo-200 group-hover:to-violet-200 transition-colors">
        <Clapperboard class="h-5 w-5 text-indigo-600" />
      </div>
      <div class="flex-1 min-w-0">
        <h3 class="text-sm font-semibold text-zinc-900 truncate group-hover:text-indigo-700 transition-colors">
          {{ project.title }}
        </h3>
        <p class="text-xs text-zinc-400 mt-0.5">
          {{ (project.genre || []).join(' · ') || '未设置类型' }} · {{ project.total_episodes }}集
        </p>
      </div>
      <Badge :class="statusMap[project.status]?.color || 'bg-zinc-100 text-zinc-600'" variant="secondary" class="text-xs shrink-0">
        {{ statusMap[project.status]?.label || project.status }}
      </Badge>
    </div>
  </NuxtLink>
</template>
