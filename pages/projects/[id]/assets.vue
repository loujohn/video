<script setup lang="ts">
import type { Asset } from '~/core/types/asset'
import { Image, Music, Video, FolderOpen, Plus } from 'lucide-vue-next'

const route = useRoute()
const projectId = route.params.id as string
const { $api } = useApi()

const typeFilter = ref<string>('')
const showUploadZone = ref(true)

const { data: project } = useAsyncData(`project-${projectId}`, () =>
  $api<any>(`/api/projects/${projectId}`),
)

const { data: assets, refresh } = useAsyncData(
  `assets-${projectId}`,
  () => {
    const base = `/api/projects/${projectId}/assets`
    const url = typeFilter.value ? `${base}?type=${typeFilter.value}` : base
    return $api<Asset[]>(url)
  },
  { watch: [typeFilter] },
)

const previewAsset = ref<Asset | null>(null)
const previewOpen = ref(false)
const deleteTarget = ref<Asset | null>(null)
const showDeleteConfirm = ref(false)
const error = ref('')

const typeTabs = [
  { key: '', label: '全部', icon: FolderOpen },
  { key: 'image', label: '图片', icon: Image },
  { key: 'audio', label: '音频', icon: Music },
  { key: 'video', label: '视频', icon: Video },
]

function onUploaded() {
  refresh()
}

function openPreview(asset: Asset) {
  previewAsset.value = asset
  previewOpen.value = true
}

function openDelete(asset: Asset) {
  deleteTarget.value = asset
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  try {
    await $api(`/api/projects/${projectId}/assets/${deleteTarget.value.id}`, {
      method: 'DELETE',
    })
    showDeleteConfirm.value = false
    deleteTarget.value = null
    refresh()
  } catch (e: any) {
    error.value = e.data?.statusMessage || '删除失败'
  }
}
</script>

<template>
  <LayoutAppLayout>
    <template #title>{{ project?.title || '项目' }} — 资源库</template>
    <div class="max-w-6xl">
      <ProjectSubNav :project-id="projectId" />

      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-bold text-zinc-900">资源库</h2>
        <Button size="sm" variant="outline" class="gap-2" @click="showUploadZone = !showUploadZone">
          <Plus class="h-3.5 w-3.5" />
          {{ showUploadZone ? '收起上传' : '上传文件' }}
        </Button>
      </div>

      <div v-if="showUploadZone" class="mb-6">
        <ProjectAssetUploadZone :project-id="projectId" @uploaded="onUploaded" />
      </div>

      <!-- Filter tabs -->
      <div class="flex gap-1 border-b border-zinc-200 mb-6">
        <button
          v-for="tab in typeTabs"
          :key="tab.key"
          @click="typeFilter = tab.key"
          :class="[
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
            typeFilter === tab.key
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300',
          ]"
        >
          <component :is="tab.icon" class="h-4 w-4" />
          {{ tab.label }}
        </button>
      </div>

      <div v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
        {{ error }}
      </div>

      <div
        v-if="assets?.length"
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        <ProjectAssetCard
          v-for="a in assets"
          :key="a.id"
          :asset="a"
          @click="openPreview"
          @delete="openDelete"
        />
      </div>

      <CommonEmptyState
        v-else
        :icon="FolderOpen"
        title="暂无资源"
        description="上传图片、音频或视频到资源库"
      >
        <Button size="sm" class="gap-2" @click="showUploadZone = true">
          <Plus class="h-3.5 w-3.5" />
          上传文件
        </Button>
      </CommonEmptyState>
    </div>

    <ProjectAssetPreviewDialog
      :open="previewOpen"
      :asset="previewAsset"
      @close="previewOpen = false; previewAsset = null"
    />

    <CommonConfirmDialog
      :open="showDeleteConfirm"
      title="确认删除"
      description="确定要删除该资源吗？"
      confirm-text="删除"
      destructive
      @confirm="handleDelete"
      @cancel="showDeleteConfirm = false; deleteTarget = null"
    />
  </LayoutAppLayout>
</template>
