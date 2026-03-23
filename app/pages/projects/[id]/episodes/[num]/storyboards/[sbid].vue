<script setup lang="ts">
import { ArrowLeft, Image as ImageIcon, Film, MapPin, User, Box, MessageSquare, Plus, ChevronDown, ChevronRight } from 'lucide-vue-next'
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

useHead({ title: computed(() => storyboard.value ? `分镜 #${String(storyboard.value.sequence_number).padStart(2, '0')} 详情` : '分镜详情') })

const shotTypeLabels: Record<string, string> = { close: '近景', medium: '中景', wide: '远景', pov: '主观', establishing: '全景' }
const transitionLabels: Record<string, string> = { cut: '直切', dissolve: '溶解', fade: '淡入淡出', wipe: '擦除' }

const showBasicInfo = ref(false)

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
    const cover = slotImages.find(a => (a.metadata as any)?.is_cover) || slotImages[0]
    result.push({
      id: `slot-${i}`,
      name: `帧 ${i}`,
      imageUrl: cover ? `/uploads/${cover.file_path}` : null,
      reviewStatus: (cover?.metadata as any)?.review_status || 'draft',
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
      <!-- Header with assignee -->
      <div class="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" @click="navigateTo(`/projects/${projectId}/episodes/${episodeNum}/storyboards`)">
          <ArrowLeft class="h-4 w-4" />
        </Button>
        <div class="flex-1 min-w-0">
          <h1 class="text-xl font-bold text-zinc-900">
            分镜 #{{ storyboard ? String(storyboard.sequence_number).padStart(2, '0') : '...' }}
          </h1>
          <p v-if="storyboard?.shot_type" class="text-sm text-zinc-500">
            {{ shotTypeLabels[storyboard.shot_type] || storyboard.shot_type }}
            <span v-if="storyboard.camera_movement"> · {{ storyboard.camera_movement }}</span>
            <span v-if="storyboard.duration_seconds"> · {{ storyboard.duration_seconds }}秒</span>
          </p>
        </div>
        <ProjectAssigneePicker
          v-if="storyboard"
          :project-id="projectId"
          :model-value="storyboard.assigned_to"
          @update:model-value="updateAssignee"
        />
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

        <!-- Associations -->
        <div class="bg-white rounded-xl border border-zinc-200/60 p-6 shadow-sm">
          <h2 class="text-sm font-semibold text-zinc-700 mb-3">关联实体</h2>
          <div class="space-y-2">
            <div v-if="storyboard.scene_variant" class="flex items-center gap-2">
              <MapPin class="h-4 w-4 text-emerald-500" />
              <NuxtLink :to="`/projects/${projectId}/scenes/${storyboard.scene_variant.scene_id}`" class="text-sm text-emerald-700 hover:underline">
                {{ storyboard.scene_variant.scene_name }} · {{ storyboard.scene_variant.name }}
              </NuxtLink>
            </div>
            <div v-else-if="storyboard.scene_id" class="flex items-center gap-2 text-sm text-zinc-500">
              <MapPin class="h-4 w-4 text-zinc-400" /> 已关联场景（未指定变体）
            </div>
            <div v-for="cl in storyboard.character_looks" :key="cl.id" class="flex items-center gap-2">
              <User class="h-4 w-4 text-violet-500" />
              <NuxtLink :to="`/projects/${projectId}/characters/${cl.character_id}`" class="text-sm text-violet-700 hover:underline">
                {{ cl.character_name }} · {{ cl.name }}
              </NuxtLink>
            </div>
            <div v-for="pv in storyboard.prop_variants" :key="pv.id" class="flex items-center gap-2">
              <Box class="h-4 w-4 text-amber-500" />
              <NuxtLink :to="`/projects/${projectId}/props/${pv.prop_id}`" class="text-sm text-amber-700 hover:underline">
                {{ pv.prop_name }} · {{ pv.name }}
              </NuxtLink>
            </div>
            <p v-if="!storyboard.scene_variant && !storyboard.scene_id && !storyboard.character_looks?.length && !storyboard.prop_variants?.length" class="text-xs text-zinc-400">暂无关联</p>
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
