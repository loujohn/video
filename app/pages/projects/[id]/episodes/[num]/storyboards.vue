<script setup lang="ts">
import type { Storyboard, Project, Scene } from '~/core/types'
import { ArrowLeft, Plus, Film, LayoutGrid, GalleryHorizontal, Trash2, Download } from 'lucide-vue-next'
import jsPDF from 'jspdf'

const draggable = defineAsyncComponent(() => import('vuedraggable'))

// Note: jsPDF has limited Chinese character support by default. Chinese text may not render correctly.

const route = useRoute()
const projectId = route.params.id as string
const episodeNum = route.params.num as string
const { $api } = useApi()

const { data: project, status: projectStatus, error: projectError, refresh: refreshProject } = useAsyncData(`project-${projectId}`, () =>
  $api<Project>(`/api/projects/${projectId}`),
)

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

async function exportPDF() {
  const data = await $api<any>(`/api/projects/${projectId}/episodes/${episodeNum}/storyboards/export`)
  if (!data?.storyboards?.length) return

  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  const contentWidth = pageWidth - 2 * margin
  let y = margin

  // Title
  doc.setFontSize(18)
  doc.text(`第${episodeNum}集 — 分镜脚本`, pageWidth / 2, y, { align: 'center' })
  y += 12

  if (data.episode?.title) {
    doc.setFontSize(12)
    doc.text(data.episode.title, pageWidth / 2, y, { align: 'center' })
    y += 10
  }

  doc.setDrawColor(200)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  const shotTypeLabels: Record<string, string> = {
    close: '近景',
    medium: '中景',
    wide: '远景',
    pov: '主观',
    establishing: '全景',
  }

  for (const sb of data.storyboards) {
    if (y > 260) {
      doc.addPage()
      y = margin
    }

    // Sequence number box
    doc.setFillColor(240, 240, 240)
    doc.roundedRect(margin, y - 4, contentWidth, 6, 1, 1, 'F')
    doc.setFontSize(10)
    doc.setTextColor(80)
    const header = `#${String(sb.sequence_number).padStart(2, '0')}  ${shotTypeLabels[sb.shot_type] || sb.shot_type || ''}  ${sb.scene_name || ''}  ${sb.camera_movement || ''}  ${sb.duration_seconds ? sb.duration_seconds + 's' : ''}`
    doc.text(header.trim(), margin + 3, y)
    y += 6

    doc.setTextColor(30)
    doc.setFontSize(9)

    if (sb.description) {
      const lines = doc.splitTextToSize(sb.description, contentWidth - 6)
      doc.text(lines, margin + 3, y + 2)
      y += lines.length * 4 + 2
    }

    if (sb.dialogue) {
      doc.setTextColor(100)
      const dLines = doc.splitTextToSize(`台词：${sb.dialogue}`, contentWidth - 6)
      doc.text(dLines, margin + 3, y + 2)
      y += dLines.length * 4 + 2
    }

    if (sb.action_direction) {
      doc.setTextColor(120)
      const aLines = doc.splitTextToSize(`动作：${sb.action_direction}`, contentWidth - 6)
      doc.text(aLines, margin + 3, y + 2)
      y += aLines.length * 4 + 2
    }

    if (sb.image_prompt) {
      doc.setTextColor(150, 100, 0)
      const pLines = doc.splitTextToSize(`提示词：${sb.image_prompt}`, contentWidth - 6)
      doc.text(pLines, margin + 3, y + 2)
      y += pLines.length * 4 + 2
    }

    doc.setTextColor(0)
    y += 6
  }

  doc.save(`分镜脚本-第${episodeNum}集.pdf`)
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
