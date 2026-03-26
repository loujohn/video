<script setup lang="ts">
import type { StoryboardWithAssociations } from '~/core/types/storyboard'
import type { Asset } from '~/core/types/asset'
import { Pencil, Trash2, MessageSquare, ExternalLink, MapPin, User, Box, ImageIcon, Film, CheckCircle2, AlertCircle } from 'lucide-vue-next'

const props = defineProps<{
  storyboard: StoryboardWithAssociations
  projectId?: string
  episodeNum?: string | number
  commentCount?: number
  projectAssets?: Asset[]
}>()

const emit = defineEmits<{
  (e: 'edit'): void
  (e: 'delete'): void
  (e: 'comment'): void
}>()

const shotTypeLabels: Record<string, string> = { close: '近景', medium: '中景', wide: '远景', pov: '主观', establishing: '全景' }
const transitionLabels: Record<string, string> = {
  cut: '硬切', dissolve: '溶解', fade: '淡入淡出', wipe: '推移',
  fade_black: '渐黑', fade_white: '渐白', match_cut: '匹配剪辑',
}

function truncate(str: string | null | undefined, maxLen: number): string {
  if (!str) return ''
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str
}

function goToDetail() {
  if (props.projectId && props.episodeNum) {
    navigateTo(`/projects/${props.projectId}/episodes/${props.episodeNum}/storyboards/${props.storyboard.id}`)
  }
}

const sceneVariantImage = computed(() => {
  if (!props.storyboard.scene_variant || !props.projectAssets?.length) return null
  const variantId = props.storyboard.scene_variant.id
  const sceneId = props.storyboard.scene_variant.scene_id
  return props.projectAssets.find(a =>
    a.linked_entity_type === 'scene_variant' && a.linked_entity_id === variantId && a.type === 'image' && a.is_active,
  ) ?? props.projectAssets.find(a =>
    a.linked_entity_type === 'scene' && a.linked_entity_id === sceneId && a.type === 'image' && a.is_active,
  ) ?? null
})

const thumbnailUrl = computed(() => {
  const ref = props.storyboard.reference_image_url
  if (ref && (ref.startsWith('/') || ref.startsWith('http'))) return ref
  if (sceneVariantImage.value) return `/uploads/${sceneVariantImage.value.file_path}`
  return null
})

const promptQuality = computed(() => {
  const vp = props.storyboard.video_prompt
  if (!vp) return null
  try {
    const parsed = JSON.parse(vp)
    const prompt = parsed.prompt || ''
    const refs = parsed.references || []
    return {
      hasSceneTag: prompt.includes('【场景：'),
      hasDialogue: prompt.includes('说:"') || prompt.includes('说："') || prompt.includes('台词：') || prompt.includes('画外音'),
      hasRefs: refs.length > 0,
      refCount: refs.length,
    }
  } catch { return null }
})
</script>

<template>
  <div
    class="group relative bg-white rounded-xl border border-zinc-200/60 shadow-sm hover:shadow-md hover:border-zinc-300/60 transition-all duration-200 cursor-pointer overflow-hidden"
    @click="goToDetail"
  >
    <!-- Thumbnail -->
    <div v-if="thumbnailUrl" class="relative h-28 bg-zinc-100">
      <img :src="thumbnailUrl" class="w-full h-full object-cover" alt="" />
      <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      <div class="absolute top-2 left-2">
        <Badge variant="secondary" class="h-6 min-w-6 rounded-md bg-black/60 text-white text-xs font-mono border-0">
          {{ String(storyboard.sequence_number).padStart(2, '0') }}
        </Badge>
      </div>
      <div v-if="storyboard.duration_seconds != null" class="absolute bottom-2 right-2">
        <Badge variant="secondary" class="text-[10px] bg-black/60 text-white border-0">{{ storyboard.duration_seconds }}s</Badge>
      </div>
      <div v-if="storyboard.assigned_to_name" class="absolute top-2 right-2">
        <div class="h-6 w-6 rounded-full bg-rose-100 flex items-center justify-center" :title="storyboard.assigned_to_name">
          <span class="text-[9px] font-semibold text-rose-600">{{ storyboard.assigned_to_name?.charAt(0) }}</span>
        </div>
      </div>
    </div>
    <div v-else class="relative pt-4 px-4">
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
    </div>

    <div :class="thumbnailUrl ? 'px-4 pt-3' : 'pl-10 px-4'">
      <div class="flex flex-wrap gap-1 mb-2">
        <Badge v-if="storyboard.shot_type" variant="secondary" class="text-[10px] bg-indigo-50 text-indigo-700">
          {{ shotTypeLabels[storyboard.shot_type] || storyboard.shot_type }}
        </Badge>
        <Badge v-if="storyboard.camera_movement" variant="secondary" class="text-[10px] bg-zinc-100 text-zinc-600">
          {{ storyboard.camera_movement }}
        </Badge>
        <Badge v-if="storyboard.transition_type" variant="secondary" :class="[
          'text-[10px]',
          storyboard.transition_type === 'fade_white' ? 'bg-amber-50 text-amber-700' :
          storyboard.transition_type === 'fade_black' ? 'bg-zinc-200 text-zinc-600' :
          storyboard.transition_type === 'dissolve' ? 'bg-blue-50 text-blue-600' :
          storyboard.transition_type === 'cut' ? 'bg-green-50 text-green-600' :
          'bg-zinc-100 text-zinc-500'
        ]">
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

      <p v-if="storyboard.duration_seconds != null && !thumbnailUrl" class="text-xs text-zinc-400 mt-1">{{ storyboard.duration_seconds }}秒</p>

      <!-- Prompt status & quality indicators -->
      <div class="flex items-center gap-1.5 mt-2 flex-wrap">
        <span
          class="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full"
          :class="storyboard.image_prompt ? 'bg-indigo-50 text-indigo-600' : 'bg-zinc-50 text-zinc-400'"
        >
          <ImageIcon class="h-2.5 w-2.5" /> IMG
        </span>
        <span
          class="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full"
          :class="storyboard.video_prompt ? 'bg-rose-50 text-rose-600' : 'bg-zinc-50 text-zinc-400'"
        >
          <Film class="h-2.5 w-2.5" /> VID
        </span>
        <template v-if="promptQuality">
          <span
            class="inline-flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded-full"
            :class="promptQuality.hasSceneTag ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-400'"
            :title="promptQuality.hasSceneTag ? '已标注场景' : '缺少场景标签'"
          >
            <component :is="promptQuality.hasSceneTag ? CheckCircle2 : AlertCircle" class="h-2.5 w-2.5" /> 场景
          </span>
          <span
            v-if="storyboard.dialogue"
            class="inline-flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded-full"
            :class="promptQuality.hasDialogue ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-400'"
            :title="promptQuality.hasDialogue ? '已包含台词' : '缺少台词'"
          >
            <component :is="promptQuality.hasDialogue ? CheckCircle2 : AlertCircle" class="h-2.5 w-2.5" /> 台词
          </span>
          <span
            class="inline-flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded-full"
            :class="promptQuality.hasRefs ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-50 text-zinc-400'"
            :title="promptQuality.hasRefs ? `${promptQuality.refCount}个角色引用` : '无角色引用'"
          >
            <User class="h-2.5 w-2.5" /> {{ promptQuality.refCount || 0 }}
          </span>
        </template>
      </div>
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
