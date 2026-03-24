<script setup lang="ts">
import type { ProjectProgress } from '~/core/types/project'

const props = withDefaults(defineProps<{
  progress: ProjectProgress
  detailed?: boolean
}>(), {
  detailed: false,
})

interface BarItem {
  label: string
  current: number
  total: number
  color: string
}

const bars = computed<BarItem[]>(() => {
  const p = props.progress
  return [
    { label: '分集', current: p.episodes.written, total: p.episodes.total, color: 'bg-indigo-500' },
    { label: '分镜', current: p.storyboards.total, total: p.images.total_storyboards || p.episodes.total * 6, color: 'bg-amber-500' },
    { label: '图片', current: p.images.with_images, total: p.images.total_storyboards || 1, color: 'bg-pink-500' },
    { label: '审核', current: p.images.approved, total: p.images.total_storyboards || 1, color: 'bg-green-500' },
  ]
})

function pct(current: number, total: number): number {
  if (total === 0) return 0
  return Math.min(Math.round((current / total) * 100), 100)
}

const completedBadges = computed(() => {
  const p = props.progress
  const badges: Array<{ label: string; done: boolean }> = []
  badges.push({ label: '方案', done: p.creative_plan })
  if (p.characters.total > 0) {
    badges.push({ label: `角色${p.characters.total}`, done: true })
  }
  if (p.scenes.total > 0) {
    badges.push({ label: `场景${p.scenes.total}`, done: true })
  }
  return badges.filter(b => b.done)
})

const episodeSubtitle = computed(() => {
  const e = props.progress.episodes
  const parts: string[] = []
  if (e.written > 0) parts.push(`${e.written} 已完成`)
  if (e.writing > 0) parts.push(`${e.writing} 编写中`)
  const planned = e.created - e.written - e.writing
  if (planned > 0) parts.push(`${planned} 待编写`)
  return parts.join(' · ')
})
</script>

<template>
  <div>
    <!-- Detailed header (overview page) -->
    <div v-if="detailed" class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-zinc-700 flex items-center gap-2">
        📊 创作进度
      </h3>
      <div class="text-xl font-bold text-indigo-600">
        {{ progress.overall_percent }}<span class="text-xs text-zinc-400 font-normal">%</span>
      </div>
    </div>

    <!-- Completed badges -->
    <div v-if="completedBadges.length" class="flex gap-1.5 flex-wrap" :class="detailed ? 'mb-4' : 'mb-2'">
      <span
        v-for="badge in completedBadges"
        :key="badge.label"
        class="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full shrink-0"
      >
        ✓ {{ badge.label }}
      </span>
      <span
        v-if="progress.storyboards.with_image_prompt > 0"
        class="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full"
      >
        提示词 {{ pct(progress.storyboards.with_image_prompt, progress.storyboards.total || 1) }}%
      </span>
    </div>

    <!-- Progress bars -->
    <div :class="detailed ? 'space-y-3' : 'grid grid-cols-2 gap-x-4 gap-y-1.5'">
      <div v-for="bar in bars" :key="bar.label">
        <div class="flex items-center justify-between" :class="detailed ? 'mb-1' : 'mb-0.5'">
          <span :class="detailed ? 'text-xs text-zinc-500' : 'text-[10px] text-zinc-400'" class="w-8 shrink-0">{{ bar.label }}</span>
          <span :class="detailed ? 'text-xs text-zinc-700 font-medium' : 'text-[10px] text-zinc-500 font-medium'">{{ bar.current }}/{{ bar.total }}</span>
        </div>
        <div :class="detailed ? 'h-1.5' : 'h-1'" class="bg-zinc-100 rounded-full overflow-hidden">
          <div
            :class="bar.color"
            class="h-full rounded-full transition-all duration-500"
            :style="{ width: `${pct(bar.current, bar.total)}%` }"
          />
        </div>
        <p v-if="detailed && bar.label === '分集' && episodeSubtitle" class="text-[10px] text-zinc-400 mt-0.5">
          {{ episodeSubtitle }}
        </p>
      </div>
    </div>

    <!-- Overall percent (compact mode) -->
    <div v-if="!detailed" class="flex items-center justify-end mt-2 pt-2 border-t border-zinc-50">
      <span class="text-xs font-bold text-indigo-600">{{ progress.overall_percent }}%</span>
    </div>
  </div>
</template>
