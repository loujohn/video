<script setup lang="ts">
import { ArrowLeft, Save, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import type { Project, Episode } from '~/core/types'

const route = useRoute()
const projectId = route.params.id as string
const episodeNum = route.params.num as string
const { $api } = useApi()

const { data: project, status: projectStatus, error: projectError, refresh: refreshProject } = useAsyncData(`project-${projectId}`, () =>
  $api<Project>(`/api/projects/${projectId}`),
)

const { data: episode } = useAsyncData(`episode-${projectId}-${episodeNum}`, () =>
  $api<{ id: string }>(`/api/projects/${projectId}/episodes/${episodeNum}`),
)

const { data: episodes } = useAsyncData(`eps-nav-${projectId}`, () =>
  $api<Episode[]>(`/api/projects/${projectId}/episodes`),
)

const { data: scriptData, refresh } = useAsyncData(
  `script-${projectId}-${episodeNum}`,
  () => $api<{ id: string; content: string | null; word_count: number; version: number; created_at: string } | null>(
    `/api/projects/${projectId}/episodes/${episodeNum}/scripts`,
  ),
)

const content = ref('')
const savedContent = ref('')
watch(scriptData, (v) => {
  const c = v?.content ?? ''
  content.value = c
  savedContent.value = c
}, { immediate: true })

const hasUnsavedChanges = computed(() => content.value !== savedContent.value)

const wordCount = computed(() => content.value.replace(/[#*_~`>\-\[\]()!|]/g, '').replace(/\s/g, '').length)

const showSaveDialog = ref(false)
const changeSummary = ref('')
const saving = ref(false)
const saveError = ref('')
const lastSavedAt = ref<string | null>(null)
const showVersionHistory = ref(false)
const autoSaveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')

watch(scriptData, (v) => {
  if (v?.created_at) {
    lastSavedAt.value = formatDate(v.created_at)
  } else {
    lastSavedAt.value = null
  }
}, { immediate: true })

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function openSaveDialog() {
  changeSummary.value = ''
  saveError.value = ''
  showSaveDialog.value = true
}

async function handleSave() {
  saveError.value = ''
  saving.value = true
  try {
    await $api(`/api/projects/${projectId}/episodes/${episodeNum}/scripts`, {
      method: 'POST',
      body: { content: content.value, change_summary: changeSummary.value || undefined },
    })
    savedContent.value = content.value
    showSaveDialog.value = false
    await refresh()
  } catch (e: any) {
    saveError.value = e.data?.statusMessage || '保存失败'
  } finally {
    saving.value = false
  }
}

async function autoSave() {
  if (!hasUnsavedChanges.value || saving.value || showSaveDialog.value) return
  autoSaveStatus.value = 'saving'
  try {
    await $api(`/api/projects/${projectId}/episodes/${episodeNum}/scripts`, {
      method: 'POST',
      body: { content: content.value, change_summary: '自动保存' },
    })
    savedContent.value = content.value
    autoSaveStatus.value = 'saved'
    await refresh()
    setTimeout(() => {
      if (autoSaveStatus.value === 'saved') autoSaveStatus.value = 'idle'
    }, 3000)
  } catch {
    autoSaveStatus.value = 'error'
  }
}

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null
watch(content, () => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  if (!showSaveDialog.value) {
    autoSaveTimer = setTimeout(autoSave, 30000)
  }
})

onBeforeUnmount(() => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
})

function handleEditorSave() {
  openSaveDialog()
}

const showComments = ref(false)

function goBack() {
  navigateTo(`/projects/${projectId}/episodes`)
}

const currentEpisodeIndex = computed(() =>
  episodes.value?.findIndex((ep) => String(ep.episode_number) === episodeNum) ?? -1,
)
const prevEpisode = computed(() => {
  if (!episodes.value || currentEpisodeIndex.value <= 0) return null
  return episodes.value[currentEpisodeIndex.value - 1]
})
const nextEpisode = computed(() => {
  if (!episodes.value || currentEpisodeIndex.value < 0 || currentEpisodeIndex.value >= episodes.value.length - 1) return null
  return episodes.value[currentEpisodeIndex.value + 1]
})
</script>

<template>
  <LayoutAppLayout>
    <template #title>{{ project?.title || '项目' }} — 第 {{ episodeNum }} 集剧本</template>

    <CommonPageLoading v-if="projectStatus === 'pending'" />
    <CommonPageError v-else-if="projectError" :error="projectError" :retry-fn="refreshProject" />
    <div v-else class="flex flex-col h-[calc(100vh-8rem)] max-w-4xl">
      <ProjectSubNav :project-id="projectId" />

      <!-- Top bar -->
      <div class="flex items-center justify-between gap-4 py-4 border-b border-zinc-200/60">
        <div class="flex items-center gap-3">
          <Button variant="ghost" size="sm" class="h-8 w-8 p-0 text-zinc-500" @click="goBack">
            <ArrowLeft class="h-4 w-4" />
          </Button>
          <h2 class="text-lg font-bold text-zinc-900">第 {{ episodeNum }} 集剧本</h2>
          <Badge v-if="scriptData?.version" variant="secondary" class="text-xs">
            v{{ scriptData.version }}
          </Badge>
          <Badge v-if="hasUnsavedChanges" variant="outline" class="text-xs text-amber-600 border-amber-200 bg-amber-50">
            未保存
          </Badge>
        </div>
        <div class="flex items-center gap-2">
          <!-- Episode navigation -->
          <div class="flex items-center gap-1 mr-2">
            <NuxtLink
              v-if="prevEpisode"
              :to="`/projects/${projectId}/episodes/${prevEpisode.episode_number}/script`"
              class="inline-flex h-7 items-center gap-1 px-2 rounded-md text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
              title="上一集"
            >
              <ChevronLeft class="h-3.5 w-3.5" />
              上一集
            </NuxtLink>
            <NuxtLink
              v-if="nextEpisode"
              :to="`/projects/${projectId}/episodes/${nextEpisode.episode_number}/script`"
              class="inline-flex h-7 items-center gap-1 px-2 rounded-md text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
              title="下一集"
            >
              下一集
              <ChevronRight class="h-3.5 w-3.5" />
            </NuxtLink>
          </div>
          <Button v-if="episode?.id" variant="outline" size="sm" class="gap-2" @click="showComments = !showComments">
            <MessageSquare class="h-3.5 w-3.5" />
            {{ showComments ? '收起评论' : '评论' }}
          </Button>
          <Button v-if="episode?.id" variant="outline" size="sm" @click="showVersionHistory = true">
            版本历史
          </Button>
          <Button size="sm" class="gap-2" @click="openSaveDialog">
            <Save class="h-3.5 w-3.5" />
            保存
          </Button>
        </div>
      </div>

      <!-- Main editor -->
      <div class="flex-1 min-h-0 pt-4 overflow-y-auto">
        <ClientOnly>
          <ProjectScriptEditor
            v-model="content"
            placeholder="在此编写剧本内容..."
            @save="handleEditorSave"
          />
          <template #fallback>
            <div class="h-[400px] animate-pulse bg-zinc-100 rounded-xl" />
          </template>
        </ClientOnly>
      </div>

      <!-- Bottom status bar -->
      <div class="flex items-center justify-between gap-4 py-2 mt-4 border-t border-zinc-200/60 text-xs text-zinc-500">
        <div class="flex items-center gap-3">
          <span>字数：{{ wordCount }}</span>
          <span v-if="autoSaveStatus === 'saving'" class="text-amber-500">自动保存中...</span>
          <span v-else-if="autoSaveStatus === 'saved'" class="text-emerald-500">已自动保存</span>
          <span v-else-if="autoSaveStatus === 'error'" class="text-red-500">自动保存失败</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-zinc-400">Ctrl+S 保存</span>
          <span v-if="lastSavedAt">上次保存：{{ lastSavedAt }}</span>
        </div>
      </div>

      <!-- Comment panel -->
      <div v-if="showComments && episode?.id" class="mt-4 bg-white rounded-xl border border-zinc-200/60 p-4 shadow-sm">
        <h3 class="text-sm font-semibold text-zinc-800 mb-3 flex items-center gap-2">
          <MessageSquare class="h-4 w-4 text-indigo-600" />
          剧本评论
        </h3>
        <CommonCommentThread
          :project-id="projectId"
          entity-type="episode_script"
          :entity-id="episode.id"
        />
      </div>
    </div>

    <ProjectVersionHistorySheet
      v-if="episode?.id"
      :project-id="projectId"
      entity-type="episode_script"
      :entity-id="episode.id"
      :open="showVersionHistory"
      @close="showVersionHistory = false"
    />

    <!-- Save dialog -->
    <Dialog :open="showSaveDialog" @update:open="(v: boolean) => { if (!v) showSaveDialog = false }">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>保存剧本</DialogTitle>
          <DialogDescription>可选填写本次修改说明</DialogDescription>
        </DialogHeader>
        <div class="space-y-2 py-2">
          <Label>修改说明</Label>
          <Input v-model="changeSummary" placeholder="如：完成第一幕初稿" />
        </div>
        <div v-if="saveError" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {{ saveError }}
        </div>
        <DialogFooter class="gap-2">
          <Button variant="outline" @click="showSaveDialog = false">取消</Button>
          <Button :disabled="saving" @click="handleSave">
            {{ saving ? '保存中...' : '保存' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </LayoutAppLayout>
</template>
