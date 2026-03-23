<script setup lang="ts">
import type { StoryboardWithAssociations } from '~/core/types/storyboard'
import { Pencil, Trash2, MessageSquare, ExternalLink, MapPin, User, Box } from 'lucide-vue-next'

const props = defineProps<{
  storyboard: StoryboardWithAssociations
  projectId?: string
  episodeNum?: string | number
  commentCount?: number
}>()

const emit = defineEmits<{
  (e: 'edit'): void
  (e: 'delete'): void
  (e: 'comment'): void
}>()

const shotTypeLabels: Record<string, string> = { close: '近景', medium: '中景', wide: '远景', pov: '主观', establishing: '全景' }
const transitionLabels: Record<string, string> = { cut: '直切', dissolve: '溶解', fade: '淡入淡出', wipe: '擦除' }

function truncate(str: string | null | undefined, maxLen: number): string {
  if (!str) return ''
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str
}

function goToDetail() {
  if (props.projectId && props.episodeNum) {
    navigateTo(`/projects/${props.projectId}/episodes/${props.episodeNum}/storyboards/${props.storyboard.id}`)
  }
}
</script>

<template>
  <div
    class="group relative bg-white rounded-xl border border-zinc-200/60 p-4 shadow-sm hover:shadow-md hover:border-zinc-300/60 transition-all duration-200 cursor-pointer"
    @click="goToDetail"
  >
    <div class="absolute top-3 left-3">
      <Badge variant="secondary" class="h-6 min-w-6 rounded-md bg-zinc-100 text-zinc-600 text-xs font-mono">
        {{ String(storyboard.sequence_number).padStart(2, '0') }}
      </Badge>
    </div>
    <div v-if="storyboard.assigned_to_name" class="absolute top-3 right-3">
      <div class="h-6 w-6 rounded-full bg-rose-100 flex items-center justify-center" :title="storyboard.assigned_to_name">
        <span class="text-[9px] font-semibold text-rose-600">{{ storyboard.assigned_to_name?.charAt(0) }}</span>
      </div>
    </div>

    <div class="pl-10">
      <div class="flex flex-wrap gap-1 mb-2">
        <Badge v-if="storyboard.shot_type" variant="secondary" class="text-[10px] bg-indigo-50 text-indigo-700">
          {{ shotTypeLabels[storyboard.shot_type] || storyboard.shot_type }}
        </Badge>
        <Badge v-if="storyboard.camera_movement" variant="secondary" class="text-[10px] bg-zinc-100 text-zinc-600">
          {{ storyboard.camera_movement }}
        </Badge>
        <Badge v-if="storyboard.transition_type" variant="secondary" class="text-[10px] bg-zinc-100 text-zinc-500">
          {{ transitionLabels[storyboard.transition_type] || storyboard.transition_type }}
        </Badge>
      </div>

      <p v-if="storyboard.description" class="text-sm text-zinc-700 line-clamp-2 mb-1">
        {{ truncate(storyboard.description, 120) }}
      </p>
      <p v-if="storyboard.dialogue" class="text-xs text-zinc-500 italic line-clamp-1">
        「{{ truncate(storyboard.dialogue, 60) }}」
      </p>

      <!-- Associations -->
      <div class="flex flex-wrap gap-1.5 mt-2">
        <span v-if="storyboard.scene_variant" class="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
          <MapPin class="h-2.5 w-2.5" /> {{ storyboard.scene_variant.scene_name }} · {{ storyboard.scene_variant.name }}
        </span>
        <span v-for="cl in storyboard.character_looks" :key="cl.id" class="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700">
          <User class="h-2.5 w-2.5" /> {{ cl.character_name }} · {{ cl.name }}
        </span>
        <span v-for="pv in storyboard.prop_variants" :key="pv.id" class="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">
          <Box class="h-2.5 w-2.5" /> {{ pv.prop_name }} · {{ pv.name }}
        </span>
      </div>

      <p v-if="storyboard.duration_seconds != null" class="text-xs text-zinc-400 mt-1">{{ storyboard.duration_seconds }}秒</p>
    </div>

    <div class="flex items-center justify-between gap-1 mt-3 pt-3 border-t border-zinc-100">
      <div class="flex items-center gap-2">
        <button
          class="flex items-center gap-1 px-2 py-1 rounded text-xs text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          @click.stop="emit('comment')"
        >
          <MessageSquare class="h-3 w-3" />
          <span v-if="commentCount">{{ commentCount }}</span>
        </button>
        <button
          v-if="projectId && episodeNum"
          class="flex items-center gap-1 px-2 py-1 rounded text-xs text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          @click.stop="goToDetail"
        >
          <ExternalLink class="h-3 w-3" /> 详情
        </button>
      </div>
      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" class="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-600" @click.stop="emit('edit')">
          <Pencil class="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="sm" class="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" @click.stop="emit('delete')">
          <Trash2 class="h-3 w-3" />
        </Button>
      </div>
    </div>
  </div>
</template>
