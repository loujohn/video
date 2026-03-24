<script setup lang="ts">
import {
  Film, UserCircle, MapPin, Clapperboard,
  BookOpen, Image as ImageIcon, ExternalLink,
} from 'lucide-vue-next'

interface Props {
  type: string
  data: Record<string, unknown>
}

const props = defineProps<Props>()

const CARD_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  project: { icon: Film, color: 'bg-indigo-100 text-indigo-600', label: '项目' },
  character: { icon: UserCircle, color: 'bg-emerald-100 text-emerald-600', label: '角色' },
  episode: { icon: BookOpen, color: 'bg-amber-100 text-amber-600', label: '分集' },
  scene: { icon: MapPin, color: 'bg-cyan-100 text-cyan-600', label: '场景' },
  storyboard: { icon: Clapperboard, color: 'bg-violet-100 text-violet-600', label: '分镜' },
  creative_plan: { icon: BookOpen, color: 'bg-rose-100 text-rose-600', label: '创作方案' },
}

const config = computed(() => CARD_CONFIG[props.type] || { icon: ImageIcon, color: 'bg-zinc-100 text-zinc-600', label: props.type })
const title = computed(() => (props.data.title || props.data.name || props.data.id || '未命名') as string)
const subtitle = computed(() => {
  const parts: string[] = []
  if (props.data.genre && Array.isArray(props.data.genre)) parts.push((props.data.genre as string[]).join('·'))
  if (props.data.episode_number) parts.push(`第 ${props.data.episode_number} 集`)
  if (props.data.shot_type) parts.push(props.data.shot_type as string)
  if (props.data.description) parts.push((props.data.description as string).slice(0, 60))
  return parts.join(' · ') || undefined
})
</script>

<template>
  <div class="rounded-lg border border-zinc-200 bg-white p-3 flex items-start gap-3 hover:shadow-sm transition-shadow">
    <div class="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" :class="config.color">
      <component :is="config.icon" class="h-4 w-4" />
    </div>
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-1.5">
        <span class="text-[10px] font-semibold uppercase tracking-wider" :class="config.color.split(' ')[1]">{{ config.label }}</span>
      </div>
      <div class="text-sm font-medium text-zinc-800 truncate">{{ title }}</div>
      <div v-if="subtitle" class="text-xs text-zinc-400 truncate mt-0.5">{{ subtitle }}</div>
    </div>
  </div>
</template>
