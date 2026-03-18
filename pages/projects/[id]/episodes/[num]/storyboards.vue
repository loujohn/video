<script setup lang="ts">
import type { Storyboard } from '~/core/types/storyboard'
import { ArrowLeft, Plus, Film } from 'lucide-vue-next'
import draggable from 'vuedraggable'

const route = useRoute()
const projectId = route.params.id as string
const episodeNum = route.params.num as string
const { $api } = useApi()

const { data: project } = useAsyncData(`project-${projectId}`, () =>
  $api<any>(`/api/projects/${projectId}`),
)

const { data: storyboards, refresh } = useAsyncData(
  `storyboards-${projectId}-${episodeNum}`,
  () => $api<Storyboard[]>(`/api/projects/${projectId}/episodes/${episodeNum}/storyboards`),
)

const { data: scenes } = useAsyncData(`scenes-${projectId}`, () =>
  $api<any[]>(`/api/projects/${projectId}/scenes`),
)

const localList = ref<Storyboard[]>([])
watch(
  storyboards,
  (val) => {
    localList.value = val ? [...val] : []
  },
  { immediate: true },
)

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
</script>

<template>
  <LayoutAppLayout>
    <template #title>第{{ episodeNum }}集 — 分镜管理</template>

    <div class="max-w-6xl">
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
        <Button @click="openCreate" size="sm" class="gap-2">
          <Plus class="h-3.5 w-3.5" />
          新建分镜
        </Button>
      </div>

      <div v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
        {{ error }}
      </div>

      <draggable
        v-if="storyboards?.length"
        v-model="localList"
        item-key="id"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        :disabled="reordering"
        @end="onDragEnd"
      >
        <template #item="{ element }">
          <ProjectStoryboardCard
            :storyboard="element"
            @edit="openEdit(element)"
            @delete="openDelete(element)"
          />
        </template>
      </draggable>

      <CommonEmptyState
        v-else
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
  </LayoutAppLayout>
</template>
