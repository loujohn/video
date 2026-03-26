<script setup lang="ts">
import { ArrowLeft, Image as ImageIcon, Film, MapPin, User, Box, MessageSquare, Plus, ChevronDown, ChevronRight, ChevronLeft, Sparkles, Copy, Check, Keyboard } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { StoryboardWithAssociations } from '~/core/types/storyboard'
import type { Asset } from '~/core/types/asset'

const route = useRoute()
const projectId = route.params.id as string
const episodeNum = route.params.num as string
const sbId = route.params.sbid as string
const { $api } = useApi()

const { data: storyboard, refresh: refreshStoryboard } = useAsyncData(
  `sb-detail-${sbId}`,
  () => $api<StoryboardWithAssociations>(`/api/projects/${projectId}/episodes/${episodeNum}/storyboards/${sbId}`),
)

const { data: allAssets, refresh: refreshAssets } = useAsyncData(
  `sb-assets-${sbId}`,
  () => $api<Asset[]>(`/api/projects/${projectId}/assets?linked_entity_type=storyboard&linked_entity_id=${sbId}`),
)

const { data: siblingBoards } = useAsyncData(
  `sb-siblings-${projectId}-${episodeNum}`,
  () => $api<StoryboardWithAssociations[]>(`/api/projects/${projectId}/episodes/${episodeNum}/storyboards`),
)

const currentIndex = computed(() =>
  siblingBoards.value?.findIndex(sb => sb.id === sbId) ?? -1,
)
const prevBoard = computed(() => {
  if (!siblingBoards.value || currentIndex.value <= 0) return null
  return siblingBoards.value[currentIndex.value - 1]
})
const nextBoard = computed(() => {
  if (!siblingBoards.value || currentIndex.value < 0 || currentIndex.value >= siblingBoards.value.length - 1) return null
  return siblingBoards.value[currentIndex.value + 1]
})

function goToBoard(board: StoryboardWithAssociations) {
  navigateTo(`/projects/${projectId}/episodes/${episodeNum}/storyboards/${board.id}`)
}

onMounted(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
    if (e.key === 'ArrowLeft' && prevBoard.value) goToBoard(prevBoard.value)
    if (e.key === 'ArrowRight' && nextBoard.value) goToBoard(nextBoard.value)
  }
  window.addEventListener('keydown', handler)
  onUnmounted(() => window.removeEventListener('keydown', handler))
})

const { data: projectAssets } = useAsyncData(
  `project-assets-${projectId}`,
  () => $api<Asset[]>(`/api/projects/${projectId}/assets`),
)

const sceneRefImage = computed(() => {
  if (!storyboard.value?.scene_variant || !projectAssets.value) return null
  const sceneId = storyboard.value.scene_variant.scene_id
  return projectAssets.value.find(a =>
    a.linked_entity_type === 'scene' && a.linked_entity_id === sceneId && a.type === 'image' && a.is_active,
  ) ?? null
})

const sceneVariantImage = computed(() => {
  if (!storyboard.value?.scene_variant || !projectAssets.value) return null
  const variantId = storyboard.value.scene_variant.id
  return projectAssets.value.find(a =>
    a.linked_entity_type === 'scene_variant' && a.linked_entity_id === variantId && a.type === 'image' && a.is_active,
  ) ?? null
})

const characterImages = computed(() => {
  if (!storyboard.value?.character_looks?.length || !projectAssets.value) return []
  const result: Array<{ look: any; asset: Asset | null }> = []
  for (const cl of storyboard.value.character_looks) {
    const asset = projectAssets.value.find(a =>
      a.linked_entity_type === 'character_look' && a.linked_entity_id === cl.id && a.type === 'image' && a.is_active,
    ) ?? null
    result.push({ look: cl, asset })
  }
  return result
})

useHead({ title: computed(() => storyboard.value ? `分镜 #${String(storyboard.value.sequence_number).padStart(2, '0')} 详情` : '分镜详情') })

const shotTypeLabels: Record<string, string> = { close: '近景', medium: '中景', wide: '远景', pov: '主观', establishing: '全景' }
const transitionLabels: Record<string, string> = {
  cut: '硬切', dissolve: '溶解', fade: '淡入淡出', wipe: '推移',
  fade_black: '渐黑', fade_white: '渐白', match_cut: '匹配剪辑',
}

const showBasicInfo = ref(false)
const showImagePrompt = ref(true)
const showVideoPrompt = ref(true)
const copiedField = ref('')

const parsedVideoPrompt = computed(() => {
  const vp = storyboard.value?.video_prompt
  if (!vp) return null
  try { return JSON.parse(vp) } catch { return null }
})

const seedancePromptText = computed(() => {
  const pvp = parsedVideoPrompt.value
  if (pvp?.prompt) return pvp.prompt
  if (pvp?.positive) return pvp.positive
  return storyboard.value?.video_prompt || ''
})

async function copyToClipboard(text: string, field: string) {
  await navigator.clipboard.writeText(text)
  copiedField.value = field
  toast.success('已复制到剪贴板')
  setTimeout(() => { copiedField.value = '' }, 2000)
}

function copySeedancePrompt() {
  copyToClipboard(seedancePromptText.value, 'seedance')
}

function copyFullPromptWithRefs() {
  const parts: string[] = []
  if (seedancePromptText.value) parts.push(seedancePromptText.value)
  const refs = parsedVideoPrompt.value?.references
  if (refs?.length) parts.push('\n参考图: ' + refs.join(', '))
  copyToClipboard(parts.join('\n'), 'fullPrompt')
}

const slotCount = ref(1)

watch(allAssets, (val) => {
  if (!val) return
  const maxSlot = Math.max(1, ...val.filter(a => a.is_active).map(a => (a.metadata as any)?.slot ?? 0))
  slotCount.value = maxSlot
}, { immediate: true })

const heroItems = computed(() => {
  const active = (allAssets.value ?? []).filter(a => a.is_active)
  const result: Array<{ id: string; name: string; imageUrl: string | null; reviewStatus: string }> = []
  for (let i = 1; i <= slotCount.value; i++) {
    const slotImages = active.filter(a => (a.metadata as any)?.slot === i && a.type === 'image')
    const cover = slotImages.find(a => (a.metadata as any)?.review_status === 'approved') || slotImages[0]
    result.push({
      id: `slot-${i}`,
      name: `帧 ${i}`,
      imageUrl: cover ? `/uploads/${cover.file_path}` : null,
      reviewStatus: (cover?.metadata as any)?.review_status || 'pending',
    })
  }
  return result
})

function scrollToSlot(slotId: string) {
  document.getElementById(slotId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function addSlot() { slotCount.value++ }

async function updateAssignee(userId: string | null) {
  try {
    await $api(`/api/projects/${projectId}/episodes/${episodeNum}/storyboards/${sbId}`, { method: 'PUT', body: { assigned_to: userId } })
    await refreshStoryboard()
  } catch { toast.error('更新负责人失败') }
}
</script>

<template>
  <LayoutAppLayout>
    <template #title>分镜详情</template>
    <div class="max-w-4xl">
      <!-- Header with navigation and assignee -->
      <div class="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" @click="navigateTo(`/projects/${projectId}/episodes/${episodeNum}/storyboards`)">
          <ArrowLeft class="h-4 w-4" />
        </Button>
        <div class="flex-1 min-w-0">
          <h1 class="text-xl font-bold text-zinc-900">
            分镜 #{{ storyboard ? String(storyboard.sequence_number).padStart(2, '0') : '...' }}
            <span v-if="siblingBoards" class="text-sm font-normal text-zinc-400 ml-1">/ {{ siblingBoards.length }}</span>
          </h1>
          <p v-if="storyboard?.shot_type" class="text-sm text-zinc-500">
            {{ shotTypeLabels[storyboard.shot_type] || storyboard.shot_type }}
            <span v-if="storyboard.camera_movement"> · {{ storyboard.camera_movement }}</span>
            <span v-if="storyboard.duration_seconds"> · {{ storyboard.duration_seconds }}秒</span>
          </p>
        </div>
        <div class="flex items-center gap-1">
          <Button
            v-if="prevBoard"
            variant="outline"
            size="sm"
            class="gap-1 text-xs h-8"
            @click="goToBoard(prevBoard)"
          >
            <ChevronLeft class="h-3.5 w-3.5" />
            上一镜
          </Button>
          <Button
            v-if="nextBoard"
            variant="outline"
            size="sm"
            class="gap-1 text-xs h-8"
            @click="goToBoard(nextBoard)"
          >
            下一镜
            <ChevronRight class="h-3.5 w-3.5" />
          </Button>
        </div>
        <ProjectAssigneePicker
          v-if="storyboard"
          :project-id="projectId"
          :model-value="storyboard.assigned_to"
          @update:model-value="updateAssignee"
        />
      </div>

      <!-- Quick jump & keyboard hint -->
      <div v-if="siblingBoards && siblingBoards.length > 1" class="flex items-center gap-3 mb-4">
        <select
          :value="sbId"
          class="h-7 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-600"
          @change="navigateTo(`/projects/${projectId}/episodes/${episodeNum}/storyboards/${($event.target as HTMLSelectElement).value}`)"
        >
          <option v-for="sb in siblingBoards" :key="sb.id" :value="sb.id">
            #{{ String(sb.sequence_number).padStart(2, '0') }} {{ sb.scene_variant ? sb.scene_variant.scene_name + '·' + sb.scene_variant.name : '' }}
          </option>
        </select>
        <p class="text-[10px] text-zinc-400 flex items-center gap-1">
          <Keyboard class="h-3 w-3" /> ← → 快速切换
        </p>
      </div>

      <div v-if="storyboard" class="space-y-6">
        <!-- Hero Section: slot covers -->
        <ProjectDetailHeroSection v-if="heroItems.length" :items="heroItems" @click="scrollToSlot" />

        <!-- Basic info (collapsible) -->
        <div class="bg-white rounded-xl border border-zinc-200/60 shadow-sm overflow-hidden">
          <button type="button" class="w-full flex items-center justify-between px-6 py-4 hover:bg-zinc-50/50 transition-colors" @click="showBasicInfo = !showBasicInfo">
            <h2 class="text-sm font-semibold text-zinc-700">画面信息</h2>
            <component :is="showBasicInfo ? ChevronDown : ChevronRight" class="h-4 w-4 text-zinc-400" />
          </button>
          <div v-if="showBasicInfo" class="px-6 pb-6 border-t border-zinc-100">
            <div class="space-y-2 text-sm mt-4">
              <p v-if="storyboard.description"><span class="text-zinc-400">描述：</span><span class="text-zinc-700">{{ storyboard.description }}</span></p>
              <p v-if="storyboard.dialogue"><span class="text-zinc-400">台词：</span><span class="text-zinc-700 italic">「{{ storyboard.dialogue }}」</span></p>
              <p v-if="storyboard.action_direction"><span class="text-zinc-400">动作：</span><span class="text-zinc-700">{{ storyboard.action_direction }}</span></p>
              <p v-if="storyboard.music_cue"><span class="text-zinc-400">音效：</span><span class="text-zinc-700">{{ storyboard.music_cue }}</span></p>
              <p v-if="storyboard.transition_type"><span class="text-zinc-400">转场：</span><span class="text-zinc-700">{{ transitionLabels[storyboard.transition_type] || storyboard.transition_type }}</span></p>
            </div>
          </div>
        </div>

        <!-- Associations with reference images -->
        <div class="bg-white rounded-xl border border-zinc-200/60 p-6 shadow-sm">
          <h2 class="text-sm font-semibold text-zinc-700 mb-4">关联实体</h2>
          <div class="space-y-4">
            <!-- Scene with images -->
            <div v-if="storyboard.scene_variant">
              <div class="flex items-center gap-2 mb-2">
                <MapPin class="h-4 w-4 text-emerald-500" />
                <NuxtLink :to="`/projects/${projectId}/scenes/${storyboard.scene_variant.scene_id}`" class="text-sm font-medium text-emerald-700 hover:underline">
                  {{ storyboard.scene_variant.scene_name }} · {{ storyboard.scene_variant.name }}
                </NuxtLink>
              </div>
              <div v-if="sceneRefImage || sceneVariantImage" class="flex gap-3 ml-6">
                <div v-if="sceneRefImage" class="group relative">
                  <img :src="`/uploads/${sceneRefImage.file_path}`" class="h-20 w-32 object-cover rounded-lg border border-zinc-200 shadow-sm" alt="场景参考图" />
                  <span class="absolute bottom-1 left-1 text-[9px] px-1.5 py-0.5 bg-black/60 text-white rounded">场景参考</span>
                </div>
                <div v-if="sceneVariantImage" class="group relative">
                  <img :src="`/uploads/${sceneVariantImage.file_path}`" class="h-20 w-32 object-cover rounded-lg border border-zinc-200 shadow-sm" alt="场景变体图" />
                  <span class="absolute bottom-1 left-1 text-[9px] px-1.5 py-0.5 bg-black/60 text-white rounded">{{ storyboard.scene_variant.name }}</span>
                </div>
              </div>
            </div>
            <div v-else-if="storyboard.scene_id" class="flex items-center gap-2 text-sm text-zinc-500">
              <MapPin class="h-4 w-4 text-zinc-400" /> 已关联场景（未指定变体）
            </div>

            <!-- Characters with reference images -->
            <div v-if="characterImages.length">
              <div class="flex flex-wrap gap-4">
                <div v-for="ci in characterImages" :key="ci.look.id">
                  <div class="flex items-center gap-2 mb-1.5">
                    <User class="h-4 w-4 text-violet-500" />
                    <NuxtLink :to="`/projects/${projectId}/characters/${ci.look.character_id}`" class="text-sm font-medium text-violet-700 hover:underline">
                      {{ ci.look.character_name }}
                    </NuxtLink>
                  </div>
                  <div v-if="ci.asset" class="ml-6">
                    <img :src="`/uploads/${ci.asset.file_path}`" class="h-24 w-20 object-cover rounded-lg border border-zinc-200 shadow-sm" :alt="ci.look.character_name" />
                  </div>
                  <div v-else class="ml-6">
                    <div class="h-24 w-20 rounded-lg border border-dashed border-zinc-200 flex items-center justify-center bg-zinc-50">
                      <User class="h-6 w-6 text-zinc-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else-if="storyboard.character_looks?.length" v-for="cl in storyboard.character_looks" :key="cl.id" class="flex items-center gap-2">
              <User class="h-4 w-4 text-violet-500" />
              <NuxtLink :to="`/projects/${projectId}/characters/${cl.character_id}`" class="text-sm text-violet-700 hover:underline">
                {{ cl.character_name }} · {{ cl.name }}
              </NuxtLink>
            </div>

            <!-- Props -->
            <div v-for="pv in storyboard.prop_variants" :key="pv.id" class="flex items-center gap-2">
              <Box class="h-4 w-4 text-amber-500" />
              <NuxtLink :to="`/projects/${projectId}/props/${pv.prop_id}`" class="text-sm text-amber-700 hover:underline">
                {{ pv.prop_name }} · {{ pv.name }}
              </NuxtLink>
            </div>
            <p v-if="!storyboard.scene_variant && !storyboard.scene_id && !storyboard.character_looks?.length && !storyboard.prop_variants?.length" class="text-xs text-zinc-400">暂无关联</p>
          </div>
        </div>

        <!-- Prompts Section -->
        <div v-if="storyboard.image_prompt || storyboard.video_prompt" class="bg-white rounded-xl border border-zinc-200/60 shadow-sm overflow-hidden">
          <div class="px-6 py-4">
            <h2 class="text-sm font-semibold text-zinc-700 flex items-center gap-2">
              <Sparkles class="h-4 w-4 text-amber-500" /> AI 提示词
            </h2>
          </div>

          <!-- Image Prompt -->
          <div v-if="storyboard.image_prompt" class="border-t border-zinc-100">
            <button type="button" class="w-full flex items-center justify-between px-6 py-3 hover:bg-zinc-50/50 transition-colors" @click="showImagePrompt = !showImagePrompt">
              <span class="flex items-center gap-2 text-xs font-medium text-indigo-600">
                <ImageIcon class="h-3.5 w-3.5" /> 图片提示词
              </span>
              <div class="flex items-center gap-2">
                <button
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                  @click.stop="copyToClipboard(storyboard.image_prompt!, 'image')"
                >
                  <component :is="copiedField === 'image' ? Check : Copy" class="h-3 w-3" />
                  {{ copiedField === 'image' ? '已复制' : '复制提示词' }}
                </button>
                <component :is="showImagePrompt ? ChevronDown : ChevronRight" class="h-4 w-4 text-zinc-400" />
              </div>
            </button>
            <div v-if="showImagePrompt" class="px-6 pb-4">
              <pre class="text-xs text-zinc-600 whitespace-pre-wrap bg-zinc-50 rounded-lg p-4 leading-relaxed overflow-y-auto" style="max-height: 400px;">{{ storyboard.image_prompt }}</pre>
            </div>
          </div>

          <!-- Video Prompt -->
          <div v-if="storyboard.video_prompt" class="border-t border-zinc-100">
            <button type="button" class="w-full flex items-center justify-between px-6 py-3 hover:bg-zinc-50/50 transition-colors" @click="showVideoPrompt = !showVideoPrompt">
              <span class="flex items-center gap-2 text-xs font-medium text-rose-600">
                <Film class="h-3.5 w-3.5" /> 视频提示词 (Seedance 2.0)
              </span>
              <div class="flex items-center gap-2">
                <button
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                  @click.stop="copySeedancePrompt()"
                >
                  <component :is="copiedField === 'seedance' ? Check : Copy" class="h-3 w-3" />
                  {{ copiedField === 'seedance' ? '已复制' : '复制即梦提示词' }}
                </button>
                <component :is="showVideoPrompt ? ChevronDown : ChevronRight" class="h-4 w-4 text-zinc-400" />
              </div>
            </button>
            <div v-if="showVideoPrompt" class="px-6 pb-4">
              <div v-if="parsedVideoPrompt" class="space-y-3">
                <!-- Metadata badges -->
                <div class="flex flex-wrap gap-2">
                  <Badge v-if="parsedVideoPrompt.duration" variant="secondary" class="text-[10px]">
                    <Film class="h-3 w-3 mr-1" /> {{ parsedVideoPrompt.duration }}s
                  </Badge>
                  <Badge v-if="parsedVideoPrompt.aspect_ratio" variant="secondary" class="text-[10px]">{{ parsedVideoPrompt.aspect_ratio }}</Badge>
                  <Badge v-if="parsedVideoPrompt.shot_structure" variant="outline" class="text-[10px]">{{ parsedVideoPrompt.shot_structure }}</Badge>
                  <Badge v-if="parsedVideoPrompt.camera_movement" variant="outline" class="text-[10px]">{{ parsedVideoPrompt.camera_movement }}</Badge>
                  <Badge v-if="parsedVideoPrompt.transition_out" :class="[
                    'text-[10px]',
                    parsedVideoPrompt.transition_out === 'fade_white' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    parsedVideoPrompt.transition_out === 'fade_black' ? 'bg-zinc-100 text-zinc-700 border-zinc-300' :
                    parsedVideoPrompt.transition_out === 'dissolve' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    parsedVideoPrompt.transition_out === 'cut' ? 'bg-green-50 text-green-700 border-green-200' :
                    ''
                  ]" variant="outline">
                    转场: {{ transitionLabels[parsedVideoPrompt.transition_out] || parsedVideoPrompt.transition_out }}
                  </Badge>
                </div>

                <!-- Main prompt text -->
                <div class="bg-zinc-50 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">即梦提示词 (可直接使用)</span>
                    <button
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-zinc-500 hover:bg-zinc-200 transition-colors"
                      @click.stop="copySeedancePrompt()"
                    >
                      <component :is="copiedField === 'seedance' ? Check : Copy" class="h-3 w-3" />
                      复制
                    </button>
                  </div>
                  <pre class="text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed overflow-y-auto font-sans" style="max-height: 500px;">{{ parsedVideoPrompt.prompt || parsedVideoPrompt.positive || '' }}</pre>
                </div>

                <!-- References with copy -->
                <div v-if="parsedVideoPrompt.references?.length" class="flex items-center flex-wrap gap-1.5">
                  <span class="text-[10px] text-zinc-400 mr-1">参考图:</span>
                  <Badge v-for="ref in parsedVideoPrompt.references" :key="ref" variant="outline" class="text-[10px]">{{ ref }}</Badge>
                  <button
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors ml-2"
                    @click.stop="copyFullPromptWithRefs()"
                  >
                    <component :is="copiedField === 'fullPrompt' ? Check : Copy" class="h-3 w-3" />
                    {{ copiedField === 'fullPrompt' ? '已复制' : '复制提示词+参考图' }}
                  </button>
                </div>
              </div>
              <pre v-else class="text-xs text-zinc-600 whitespace-pre-wrap bg-zinc-50 rounded-lg p-4 leading-relaxed overflow-y-auto" style="max-height: 400px;">{{ storyboard.video_prompt }}</pre>
            </div>
          </div>
        </div>

        <!-- Keyframe slots -->
        <div class="bg-white rounded-xl border border-zinc-200/60 p-6 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-zinc-700 flex items-center gap-2"><ImageIcon class="h-4 w-4 text-indigo-500" /> 关键帧 ({{ slotCount }} 帧)</h2>
            <Button variant="outline" size="sm" class="gap-1.5 text-xs h-7" @click="addSlot"><Plus class="h-3 w-3" /> 添加帧</Button>
          </div>
          <div class="space-y-6">
            <div v-for="s in slotCount" :key="s" :id="`slot-${s}`" class="rounded-lg border border-zinc-100 overflow-hidden">
              <div class="px-4 py-2 bg-zinc-50/50 text-xs font-semibold text-zinc-500">帧 {{ s }}</div>
              <div class="px-4 pb-4">
                <ProjectEntityImageGallery
                  :project-id="projectId"
                  entity-type="storyboard"
                  :entity-id="storyboard.id"
                  :image-prompt="storyboard.image_prompt"
                  media-type="image"
                  :slot="s"
                  @refresh="refreshAssets()"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Video management -->
        <div class="bg-white rounded-xl border border-zinc-200/60 p-6 shadow-sm">
          <h2 class="text-sm font-semibold text-zinc-700 mb-4 flex items-center gap-2"><Film class="h-4 w-4 text-rose-500" /> 分镜视频</h2>
          <ProjectEntityImageGallery
            :project-id="projectId"
            entity-type="storyboard"
            :entity-id="storyboard.id"
            media-type="video"
          />
        </div>

        <!-- Storyboard comments -->
        <div class="bg-white rounded-xl border border-zinc-200/60 p-6 shadow-sm">
          <h2 class="text-sm font-semibold text-zinc-700 mb-4 flex items-center gap-2"><MessageSquare class="h-4 w-4 text-blue-500" /> 评论</h2>
          <CommonCommentThread
            :project-id="projectId"
            entity-type="storyboard"
            :entity-id="storyboard.id"
          />
        </div>
      </div>
    </div>
  </LayoutAppLayout>
</template>
