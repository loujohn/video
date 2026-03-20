<script setup lang="ts">
import type { Storyboard, Project, Scene, Episode } from '~/core/types'
import { ArrowLeft, Plus, Film, LayoutGrid, GalleryHorizontal, Trash2, Download, ChevronLeft, ChevronRight } from 'lucide-vue-next'

const draggable = defineAsyncComponent(() => import('vuedraggable'))

const route = useRoute()
const projectId = route.params.id as string
const episodeNum = route.params.num as string
const { $api } = useApi()

const { data: project, status: projectStatus, error: projectError, refresh: refreshProject } = useAsyncData(`project-${projectId}`, () =>
  $api<Project>(`/api/projects/${projectId}`),
)

const { data: episodes } = useAsyncData(`eps-nav-${projectId}`, () =>
  $api<Episode[]>(`/api/projects/${projectId}/episodes`),
)

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

const { data: storyboards, refresh } = useAsyncData(
  `storyboards-${projectId}-${episodeNum}`,
  () => $api<Storyboard[]>(`/api/projects/${projectId}/episodes/${episodeNum}/storyboards`),
)

const commentTarget = ref<Storyboard | null>(null)
const showComments = ref(false)

function openComments(sb: Storyboard) {
  commentTarget.value = sb
  showComments.value = true
}

const commentCounts = ref<Record<string, number>>({})

async function loadCommentCounts() {
  if (!storyboards.value?.length) return
  try {
    const ids = storyboards.value.map(s => s.id)
    const params = new URLSearchParams()
    params.set('entity_type', 'storyboard')
    for (const id of ids) params.append('entity_ids', id)
    const res = await $api<Record<string, number>>(
      `/api/projects/${projectId}/comments/counts?${params.toString()}`,
    )
    commentCounts.value = res || {}
  } catch {}
}

watch(storyboards, () => { loadCommentCounts() }, { immediate: true })

const { data: scenes } = useAsyncData(`scenes-${projectId}`, () =>
  $api<Scene[]>(`/api/projects/${projectId}/scenes`),
)

const localList = ref<Storyboard[]>([])
watch(
  storyboards,
  (val) => {
    localList.value = val ? [...val] : []
  },
  { immediate: true },
)

const viewMode = ref<'grid' | 'timeline'>('grid')
const showForm = ref(false)
const editingStoryboard = ref<Storyboard | null>(null)
const loading = ref(false)
const error = ref('')
const reordering = ref(false)

function openCreate() {
  editingStoryboard.value = null
  error.value = ''
  showForm.value = true
}

function openEdit(sb: Storyboard) {
  editingStoryboard.value = sb
  error.value = ''
  showForm.value = true
}

async function handleFormSubmit(data: Record<string, unknown>) {
  error.value = ''
  loading.value = true
  try {
    if (editingStoryboard.value) {
      await $api(`/api/projects/${projectId}/episodes/${episodeNum}/storyboards/${editingStoryboard.value.id}`, {
        method: 'PUT',
        body: data,
      })
    } else {
      await $api(`/api/projects/${projectId}/episodes/${episodeNum}/storyboards`, {
        method: 'POST',
        body: data,
      })
    }
    showForm.value = false
    editingStoryboard.value = null
    await refresh()
  } catch (e: any) {
    error.value = e.data?.statusMessage || '操作失败'
  } finally {
    loading.value = false
  }
}

const deleteTarget = ref<Storyboard | null>(null)
const showDeleteConfirm = ref(false)

function openDelete(sb: Storyboard) {
  deleteTarget.value = sb
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  try {
    await $api(
      `/api/projects/${projectId}/episodes/${episodeNum}/storyboards/${deleteTarget.value.id}`,
      { method: 'DELETE' },
    )
    showDeleteConfirm.value = false
    deleteTarget.value = null
    await refresh()
  } catch (e: any) {
    error.value = e.data?.statusMessage || '删除失败'
  }
}

async function onDragEnd() {
  if (!localList.value.length) return
  reordering.value = true
  error.value = ''
  try {
    const ids = localList.value.map((s) => s.id)
    await $api(`/api/projects/${projectId}/episodes/${episodeNum}/storyboards/reorder`, {
      method: 'PUT',
      body: { ids },
    })
    await refresh()
  } catch (e: any) {
    error.value = e.data?.statusMessage || '排序失败'
  } finally {
    reordering.value = false
  }
}

function goBack() {
  navigateTo(`/projects/${projectId}/episodes`)
}

const sceneOptions = computed(() =>
  (scenes.value ?? []).map((s) => ({ id: s.id, name: s.name })),
)

const shotTypeLabels: Record<string, string> = {
  close: '近景',
  medium: '中景',
  wide: '远景',
  pov: '主观',
  establishing: '全景',
}

async function exportPDF() {
  const data = await $api<any>(`/api/projects/${projectId}/episodes/${episodeNum}/storyboards/export`)
  if (!data?.storyboards?.length) return

  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const storyboardsHtml = data.storyboards.map((sb: any) => {
    const meta = [
      `#${String(sb.sequence_number).padStart(2, '0')}`,
      shotTypeLabels[sb.shot_type] || sb.shot_type || '',
      sb.scene_name || '',
      sb.camera_movement || '',
      sb.duration_seconds ? `${sb.duration_seconds}s` : '',
    ].filter(Boolean).join('  ')

    const sections = []
    if (sb.description) sections.push(`<p class="desc">${escapeHtml(sb.description)}</p>`)
    if (sb.dialogue) sections.push(`<p class="dialogue">台词：${escapeHtml(sb.dialogue)}</p>`)
    if (sb.action_direction) sections.push(`<p class="action">动作：${escapeHtml(sb.action_direction)}</p>`)
    if (sb.image_prompt) sections.push(`<p class="prompt">提示词：${escapeHtml(sb.image_prompt)}</p>`)

    return `<div class="storyboard"><div class="header">${escapeHtml(meta)}</div>${sections.join('')}</div>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>分镜脚本-第${episodeNum}集</title>
<style>
  @page { margin: 15mm; }
  body { font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; color: #1e1e1e; font-size: 10pt; line-height: 1.6; }
  h1 { text-align: center; font-size: 18pt; margin-bottom: 4pt; }
  h2 { text-align: center; font-size: 12pt; color: #666; margin-bottom: 12pt; }
  hr { border: none; border-top: 1px solid #ccc; margin: 8pt 0; }
  .storyboard { margin-bottom: 12pt; break-inside: avoid; }
  .header { background: #f0f0f0; padding: 4pt 8pt; font-size: 9pt; color: #444; border-radius: 3pt; font-weight: 500; }
  .desc { margin: 4pt 0 2pt 8pt; font-size: 9pt; }
  .dialogue { margin: 2pt 0 2pt 8pt; font-size: 9pt; color: #555; }
  .action { margin: 2pt 0 2pt 8pt; font-size: 9pt; color: #666; }
  .prompt { margin: 2pt 0 2pt 8pt; font-size: 9pt; color: #96640a; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<h1>第${episodeNum}集 — 分镜脚本</h1>
${data.episode?.title ? `<h2>${escapeHtml(data.episode.title)}</h2>` : ''}
<hr>
${storyboardsHtml}
<script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`

  printWindow.document.write(html)
  printWindow.document.close()
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
</script>

<template>
  <LayoutAppLayout>
    <template #title>第{{ episodeNum }}集 — 分镜管理</template>

    <CommonPageLoading v-if="projectStatus === 'pending'" />
    <CommonPageError v-else-if="projectError" :error="projectError" :retry-fn="refreshProject" />
    <div v-else class="max-w-6xl">
      <div class="flex items-center justify-between gap-4 mb-6">
        <div class="flex items-center gap-3">
          <NuxtLink
            :to="`/projects/${projectId}/episodes`"
            class="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          >
            <ArrowLeft class="h-4 w-4" />
          </NuxtLink>
          <h2 class="text-lg font-bold text-zinc-900">第{{ episodeNum }}集 — 分镜管理</h2>
        </div>
        <div class="flex items-center gap-2">
          <!-- Episode navigation -->
          <div class="flex items-center gap-1 mr-1">
            <NuxtLink
              v-if="prevEpisode"
              :to="`/projects/${projectId}/episodes/${prevEpisode.episode_number}/storyboards`"
              class="inline-flex h-7 items-center gap-1 px-2 rounded-md text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
              title="上一集"
            >
              <ChevronLeft class="h-3.5 w-3.5" />
              上一集
            </NuxtLink>
            <NuxtLink
              v-if="nextEpisode"
              :to="`/projects/${projectId}/episodes/${nextEpisode.episode_number}/storyboards`"
              class="inline-flex h-7 items-center gap-1 px-2 rounded-md text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
              title="下一集"
            >
              下一集
              <ChevronRight class="h-3.5 w-3.5" />
            </NuxtLink>
          </div>
          <div class="flex items-center rounded-lg border border-zinc-200 p-0.5">
            <button
              :class="['px-2 py-1 rounded-md text-xs font-medium transition-colors', viewMode === 'grid' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-700']"
              @click="viewMode = 'grid'"
            >
              <LayoutGrid class="h-3.5 w-3.5" />
            </button>
            <button
              :class="['px-2 py-1 rounded-md text-xs font-medium transition-colors', viewMode === 'timeline' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-700']"
              @click="viewMode = 'timeline'"
            >
              <GalleryHorizontal class="h-3.5 w-3.5" />
            </button>
          </div>
          <Button variant="outline" size="sm" class="gap-2" @click="exportPDF">
            <Download class="h-3.5 w-3.5" />
            导出PDF
          </Button>
          <Button @click="openCreate" size="sm" class="gap-2">
            <Plus class="h-3.5 w-3.5" />
            新建分镜
          </Button>
        </div>
      </div>

      <div v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
        {{ error }}
      </div>

      <ClientOnly>
        <draggable
          v-if="storyboards?.length && viewMode === 'grid'"
          v-model="localList"
          item-key="id"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          :disabled="reordering"
          @end="onDragEnd"
        >
          <template #item="{ element }">
            <ProjectStoryboardCard
              :storyboard="element"
              :project-id="projectId"
              :comment-count="commentCounts[element.id] || 0"
              @edit="openEdit(element)"
              @delete="openDelete(element)"
              @comment="openComments(element)"
            />
          </template>
        </draggable>
      </ClientOnly>

      <!-- Timeline horizontal view -->
      <div
        v-if="storyboards?.length && viewMode === 'timeline'"
        class="overflow-x-auto pb-4"
      >
        <div class="flex gap-4" style="min-width: max-content">
          <div
            v-for="sb in localList"
            :key="sb.id"
            class="w-64 shrink-0 bg-white rounded-xl border border-zinc-200/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
            @click="openEdit(sb)"
          >
            <!-- Thumbnail -->
            <div class="h-36 bg-zinc-100 relative">
              <img
                v-if="sb.reference_image_url && (sb.reference_image_url.startsWith('/') || sb.reference_image_url.startsWith('http'))"
                :src="sb.reference_image_url"
                class="w-full h-full object-cover"
                alt=""
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <Film class="h-8 w-8 text-zinc-300" />
              </div>
              <div class="absolute top-2 left-2">
                <Badge variant="secondary" class="h-6 min-w-6 rounded bg-black/60 text-white text-xs font-mono border-0">
                  {{ String(sb.sequence_number).padStart(2, '0') }}
                </Badge>
              </div>
              <div v-if="sb.shot_type" class="absolute bottom-2 left-2">
                <Badge variant="secondary" class="text-[10px] bg-white/90 text-zinc-700 border-0">
                  {{ sb.shot_type }}
                </Badge>
              </div>
            </div>
            <!-- Content -->
            <div class="p-3">
              <p v-if="sb.description" class="text-xs text-zinc-700 line-clamp-2 mb-1">{{ sb.description }}</p>
              <p v-if="sb.dialogue" class="text-xs text-zinc-500 italic line-clamp-1">「{{ sb.dialogue }}」</p>
              <div class="mt-2">
                <ProjectEntityImageGallery
                  :project-id="projectId"
                  entity-type="storyboard"
                  :entity-id="sb.id"
                  :image-prompt="sb.image_prompt"
                  compact
                />
              </div>
              <div class="flex items-center justify-between mt-2">
                <span v-if="sb.duration_seconds" class="text-[10px] text-zinc-400">{{ sb.duration_seconds }}秒</span>
                <button
                  class="text-red-500 hover:text-red-600 p-1"
                  @click.stop="openDelete(sb)"
                >
                  <Trash2 class="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CommonEmptyState
        v-if="!storyboards?.length"
        :icon="Film"
        title="暂无分镜"
        description="添加分镜开始规划镜头"
      >
        <Button @click="openCreate" size="sm" class="gap-2">
          <Plus class="h-3.5 w-3.5" />
          新建分镜
        </Button>
      </CommonEmptyState>
    </div>

    <ProjectStoryboardFormDialog
      :open="showForm"
      :storyboard="editingStoryboard"
      :scenes="sceneOptions"
      :project-id="projectId"
      @close="showForm = false; editingStoryboard = null"
      @submit="handleFormSubmit"
    />

    <CommonConfirmDialog
      :open="showDeleteConfirm"
      title="确认删除"
      description="确定要删除该分镜吗？"
      confirm-text="删除"
      destructive
      @confirm="handleDelete"
      @cancel="showDeleteConfirm = false; deleteTarget = null"
    />

    <Sheet :open="showComments" @update:open="(v: boolean) => { if (!v) { showComments = false; commentTarget = null } }">
      <SheetContent class="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>分镜 #{{ commentTarget ? String(commentTarget.sequence_number).padStart(2, '0') : '' }} 评论</SheetTitle>
        </SheetHeader>
        <div class="mt-4">
          <CommonCommentThread
            v-if="commentTarget"
            :project-id="projectId"
            entity-type="storyboard"
            :entity-id="commentTarget.id"
          />
        </div>
      </SheetContent>
    </Sheet>
  </LayoutAppLayout>
</template>
