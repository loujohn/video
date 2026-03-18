<script setup lang="ts">
import type { Asset } from '~/core/types/asset'
import { Image, Music, Video, FolderOpen, Plus, CheckSquare, X, Columns2 } from 'lucide-vue-next'

const route = useRoute()
const projectId = route.params.id as string
const { $api } = useApi()

const typeFilter = ref<string>('')
const showUploadZone = ref(true)
const batchMode = ref(false)
const selectedIds = ref<Set<string>>(new Set())
const compareOpen = ref(false)

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

const entityTypeLabels: Record<string, string> = {
  character: '角色',
  scene: '场景',
  prop: '道具',
  storyboard: '分镜',
}

const selectedAssets = computed(() =>
  (assets.value ?? []).filter(a => selectedIds.value.has(a.id))
)

const selectedImages = computed(() =>
  selectedAssets.value.filter(a => a.type === 'image')
)

function onUploaded() {
  refresh()
}

function openPreview(asset: Asset) {
  if (batchMode.value) {
    toggleSelect(asset.id)
    return
  }
  previewAsset.value = asset
  previewOpen.value = true
}

function openDelete(asset: Asset) {
  deleteTarget.value = asset
  showDeleteConfirm.value = true
}

function toggleSelect(id: string) {
  const s = new Set(selectedIds.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  selectedIds.value = s
}

function selectAll() {
  selectedIds.value = new Set((assets.value ?? []).map(a => a.id))
}

function clearSelection() {
  selectedIds.value = new Set()
  batchMode.value = false
}

async function handleDelete() {
  if (!deleteTarget.value) return
  try {
    await $api(`/api/projects/${projectId}/assets/${deleteTarget.value.id}`, { method: 'DELETE' })
    showDeleteConfirm.value = false
    deleteTarget.value = null
    refresh()
  } catch (e: any) {
    error.value = e.data?.statusMessage || '删除失败'
  }
}

async function batchDelete() {
  const ids = Array.from(selectedIds.value)
  for (const id of ids) {
    try {
      await $api(`/api/projects/${projectId}/assets/${id}`, { method: 'DELETE' })
    } catch {}
  }
  selectedIds.value = new Set()
  batchMode.value = false
  refresh()
}

function openCompare() {
  if (selectedImages.value.length >= 2) {
    compareOpen.value = true
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
        <div class="flex items-center gap-2">
          <Button
            v-if="assets?.length"
            size="sm"
            :variant="batchMode ? 'default' : 'outline'"
            class="gap-2"
            @click="batchMode = !batchMode; if (!batchMode) clearSelection()"
          >
            <CheckSquare class="h-3.5 w-3.5" />
            {{ batchMode ? '退出批量' : '批量管理' }}
          </Button>
          <Button size="sm" variant="outline" class="gap-2" @click="showUploadZone = !showUploadZone">
            <Plus class="h-3.5 w-3.5" />
            {{ showUploadZone ? '收起上传' : '上传文件' }}
          </Button>
        </div>
      </div>

      <!-- Batch action bar -->
      <div v-if="batchMode && selectedIds.size > 0" class="flex items-center gap-3 mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200/60">
        <span class="text-sm text-indigo-700 font-medium">已选 {{ selectedIds.size }} 项</span>
        <Button size="sm" variant="outline" class="h-7 text-xs" @click="selectAll">全选</Button>
        <Button
          v-if="selectedImages.length >= 2"
          size="sm"
          variant="outline"
          class="h-7 text-xs gap-1"
          @click="openCompare"
        >
          <Columns2 class="h-3 w-3" />
          对比图片
        </Button>
        <div class="flex-1" />
        <Button size="sm" variant="destructive" class="h-7 text-xs" @click="batchDelete">
          删除选中 ({{ selectedIds.size }})
        </Button>
        <Button size="sm" variant="ghost" class="h-7 text-xs" @click="clearSelection">
          <X class="h-3 w-3" />
          取消
        </Button>
      </div>

      <div v-if="showUploadZone" class="mb-6">
        <ProjectAssetUploadZone :project-id="projectId" @uploaded="onUploaded" />
      </div>

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
        <div
          v-for="a in assets"
          :key="a.id"
          class="relative"
        >
          <!-- Batch checkbox -->
          <div
            v-if="batchMode"
            class="absolute top-2 left-2 z-10 cursor-pointer"
            @click.stop="toggleSelect(a.id)"
          >
            <div
              :class="[
                'h-5 w-5 rounded border-2 flex items-center justify-center transition-colors',
                selectedIds.has(a.id)
                  ? 'bg-indigo-600 border-indigo-600'
                  : 'bg-white/80 border-zinc-300',
              ]"
            >
              <svg v-if="selectedIds.has(a.id)" class="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <!-- Entity link badge -->
          <div
            v-if="a.linked_entity_type"
            class="absolute top-2 z-10"
            :class="batchMode ? 'left-9' : 'left-2'"
          >
            <Badge variant="secondary" class="text-[10px] bg-indigo-100 text-indigo-700 border-0">
              {{ entityTypeLabels[a.linked_entity_type] || a.linked_entity_type }}
            </Badge>
          </div>
          <ProjectAssetCard
            :asset="a"
            @click="openPreview"
            @delete="openDelete"
          />
        </div>
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

    <!-- Image comparison dialog -->
    <Dialog :open="compareOpen" @update:open="(v: boolean) => { if (!v) compareOpen = false }">
      <DialogContent class="max-w-5xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>图片对比</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4" :class="selectedImages.length === 2 ? 'grid-cols-2' : 'grid-cols-3'">
          <div
            v-for="img in selectedImages"
            :key="img.id"
            class="rounded-lg overflow-hidden border border-zinc-200"
          >
            <img
              :src="`/uploads/${img.file_path}`"
              :alt="img.file_name || ''"
              class="w-full h-auto object-contain"
            />
            <div class="p-2 bg-zinc-50 text-xs text-zinc-600 truncate">
              {{ img.file_name || '—' }}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

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
