<script setup lang="ts">
import type { Storyboard } from '~/core/types/storyboard'
import { Pencil, Trash2 } from 'lucide-vue-next'

defineProps<{
  storyboard: Storyboard
}>()

const emit = defineEmits<{
  (e: 'edit'): void
  (e: 'delete'): void
}>()

const shotTypeLabels: Record<string, string> = {
  close: '近景',
  medium: '中景',
  wide: '远景',
  pov: '主观',
  establishing: '全景',
}

const transitionLabels: Record<string, string> = {
  cut: '直切',
  dissolve: '溶解',
  fade: '淡入淡出',
  wipe: '擦除',
}

function truncate(str: string | null | undefined, maxLen: number): string {
  if (!str) return ''
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str
}

function safeImageUrl(url: string | null): string {
  if (!url) return ''
  if (url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://')) return url
  return ''
}
</script>

<template>
  <div
    class="group relative bg-white rounded-xl border border-zinc-200/60 p-4 shadow-sm hover:shadow-md hover:border-zinc-300/60 transition-all duration-200"
  >
    <div class="absolute top-3 left-3">
      <Badge variant="secondary" class="h-6 min-w-6 rounded-md bg-zinc-100 text-zinc-600 text-xs font-mono">
        {{ String(storyboard.sequence_number).padStart(2, '0') }}
      </Badge>
    </div>

    <div class="flex gap-3 pl-10">
      <div v-if="safeImageUrl(storyboard.reference_image_url)" class="shrink-0">
        <img
          :src="safeImageUrl(storyboard.reference_image_url)"
          alt="参考图"
          class="h-16 w-24 rounded-lg object-cover border border-zinc-100"
        />
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex flex-wrap gap-1 mb-2">
          <Badge
            v-if="storyboard.shot_type"
            variant="secondary"
            class="text-[10px] bg-indigo-50 text-indigo-700"
          >
            {{ shotTypeLabels[storyboard.shot_type] || storyboard.shot_type }}
          </Badge>
          <Badge
            v-if="storyboard.camera_movement"
            variant="secondary"
            class="text-[10px] bg-zinc-100 text-zinc-600"
          >
            {{ storyboard.camera_movement }}
          </Badge>
          <Badge
            v-if="storyboard.transition_type"
            variant="secondary"
            class="text-[10px] bg-zinc-100 text-zinc-500"
          >
            {{ transitionLabels[storyboard.transition_type] || storyboard.transition_type }}
          </Badge>
        </div>
        <p v-if="storyboard.description" class="text-sm text-zinc-700 line-clamp-2 mb-1">
          {{ truncate(storyboard.description, 120) }}
        </p>
        <p v-if="storyboard.dialogue" class="text-xs text-zinc-500 italic line-clamp-1">
          「{{ truncate(storyboard.dialogue, 60) }}」
        </p>
        <p v-if="storyboard.duration_seconds != null" class="text-xs text-zinc-400 mt-1">
          {{ storyboard.duration_seconds }}秒
        </p>
      </div>
    </div>

    <div class="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-zinc-100 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button variant="ghost" size="sm" class="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-600" @click="emit('edit')">
        <Pencil class="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        class="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
        @click="emit('delete')"
      >
        <Trash2 class="h-3 w-3" />
      </Button>
    </div>
  </div>
</template>
