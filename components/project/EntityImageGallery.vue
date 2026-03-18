<script setup lang="ts">
import { Upload, ZoomIn, Trash2, Ban, RotateCcw, Star } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Asset } from '~/core/types/asset'

const props = defineProps<{
  projectId: string
  entityType: string
  entityId: string
  imagePrompt?: string | null
  compact?: boolean
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'cover-change', url: string | null): void
}>()
const { $api } = useApi()
const token = useCookie('token')

const showDiscarded = ref(false)

const assetsUrl = computed(() => {
  const base = `/api/projects/${props.projectId}/assets?linked_entity_type=${encodeURIComponent(props.entityType)}&linked_entity_id=${encodeURIComponent(props.entityId)}&type=image`
  return showDiscarded.value ? `${base}&is_active=all` : base
})

const { data: images, refresh } = useAsyncData(
  `entity-images-${props.entityType}-${props.entityId}`,
  () => $api<Asset[]>(assetsUrl.value),
  { watch: [() => props.entityId, assetsUrl] },
)

const activeImages = computed(() => (images.value ?? []).filter(i => i.is_active))
const discardedImages = computed(() => (images.value ?? []).filter(i => !i.is_active))
const discardedCount = computed(() => discardedImages.value.length)

const coverImage = computed(() => {
  const active = activeImages.value
  const starred = active.find(i => (i.metadata as any)?.is_cover)
  return starred || active[0] || null
})

const coverUrl = computed(() => coverImage.value ? `/uploads/${coverImage.value.file_path}` : null)

watch(coverUrl, (url) => {
  emit('cover-change', url)
}, { immediate: true })

const previewIndex = ref(0)
const showPreview = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const uploadProgress = ref(0)
const totalFiles = ref(0)
const dragOver = ref(false)

const previewUrl = computed(() => {
  const img = activeImages.value[previewIndex.value]
  return img ? `/uploads/${img.file_path}` : ''
})

const previewInfo = computed(() => {
  const img = activeImages.value[previewIndex.value]
  return img ? { name: img.file_name || '未命名', index: previewIndex.value + 1, total: activeImages.value.length } : null
})

function openPreview(url: string) {
  const idx = activeImages.value.findIndex(i => `/uploads/${i.file_path}` === url)
  previewIndex.value = idx >= 0 ? idx : 0
  showPreview.value = true
}

function prevImage() {
  if (previewIndex.value > 0) previewIndex.value--
}

function nextImage() {
  if (previewIndex.value < activeImages.value.length - 1) previewIndex.value++
}

function isCover(asset: Asset): boolean {
  return coverImage.value?.id === asset.id
}

async function setCover(asset: Asset) {
  const active = activeImages.value
  for (const img of active) {
    if ((img.metadata as any)?.is_cover) {
      const meta = { ...(img.metadata as any) }
      delete meta.is_cover
      await $api(`/api/projects/${props.projectId}/assets/${img.id}`, {
        method: 'PUT',
        body: { metadata: meta },
      }).catch(() => {})
    }
  }
  const newMeta = { ...(asset.metadata as any), is_cover: true }
  try {
    await $api(`/api/projects/${props.projectId}/assets/${asset.id}`, {
      method: 'PUT',
      body: { metadata: newMeta },
    })
    toast.success('已设为封面')
  } catch {
    toast.error('设置封面失败')
  }
  await refresh()
  emit('refresh')
}

async function toggleActive(asset: Asset) {
  const newState = !asset.is_active
  try {
    await $api(`/api/projects/${props.projectId}/assets/${asset.id}`, {
      method: 'PUT',
      body: { is_active: newState },
    })
    toast.success(newState ? '已恢复启用' : '已废弃')
    await refresh()
    emit('refresh')
  } catch {
    toast.error('操作失败')
  }
}

async function deleteImage(assetId: string) {
  try {
    await $api(`/api/projects/${props.projectId}/assets/${assetId}`, { method: 'DELETE' })
    toast.success('已删除')
    await refresh()
    emit('refresh')
  } catch {
    toast.error('删除失败')
  }
}

async function uploadFiles(files: File[]) {
  if (!files.length) return
  const imageFiles = files.filter(f => f.type.startsWith('image/'))
  if (!imageFiles.length) {
    toast.error('请选择图片文件')
    return
  }

  uploading.value = true
  totalFiles.value = imageFiles.length
  uploadProgress.value = 0

  let successCount = 0
  for (const file of imageFiles) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', 'reference')
    formData.append('linked_entity_type', props.entityType)
    formData.append('linked_entity_id', props.entityId)

    try {
      await $fetch(`/api/projects/${props.projectId}/assets`, {
        method: 'POST',
        body: formData,
        headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
      })
      successCount++
    } catch {}
    uploadProgress.value++
  }
  uploading.value = false
  uploadProgress.value = 0
  totalFiles.value = 0
  if (successCount > 0) toast.success(`已上传 ${successCount} 张图片`)
  else toast.error('上传失败')
  await refresh()
  emit('refresh')
}

async function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  await uploadFiles(files)
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  dragOver.value = false
  const files = Array.from(e.dataTransfer?.files ?? [])
  uploadFiles(files)
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  dragOver.value = true
}

function onDragLeave() {
  dragOver.value = false
}
</script>

<template>
  <div
    class="space-y-2 relative rounded-lg transition-all"
    :class="dragOver ? 'ring-2 ring-indigo-400 ring-offset-2 bg-indigo-50/50' : ''"
    @drop="onDrop"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
  >
    <!-- Drag overlay -->
    <div
      v-if="dragOver"
      class="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-indigo-50/80 border-2 border-dashed border-indigo-400 pointer-events-none"
    >
      <div class="text-center">
        <Upload class="h-6 w-6 text-indigo-500 mx-auto mb-1" />
        <p class="text-xs text-indigo-600 font-medium">拖放图片到此处</p>
      </div>
    </div>

    <!-- Upload progress -->
    <div v-if="uploading && totalFiles > 0" class="flex items-center gap-2 px-2 py-1.5 rounded bg-indigo-50 border border-indigo-200/60">
      <div class="flex-1 h-1.5 bg-indigo-100 rounded-full overflow-hidden">
        <div class="h-full bg-indigo-500 rounded-full transition-all duration-300" :style="{ width: `${(uploadProgress / totalFiles) * 100}%` }" />
      </div>
      <span class="text-[10px] text-indigo-600 font-medium whitespace-nowrap">{{ uploadProgress }}/{{ totalFiles }}</span>
    </div>

    <!-- Image prompt display -->
    <div v-if="imagePrompt" class="rounded-lg bg-amber-50 border border-amber-200/60 px-3 py-2">
      <p class="text-[10px] font-medium text-amber-600 uppercase tracking-wider mb-0.5">提示词 Prompt</p>
      <p class="text-xs text-amber-900 whitespace-pre-wrap line-clamp-3">{{ imagePrompt }}</p>
    </div>

    <!-- Active images grid -->
    <div v-if="activeImages.length" class="grid gap-1.5" :class="compact ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'">
      <div
        v-for="img in activeImages"
        :key="img.id"
        class="group/img relative aspect-square rounded-lg overflow-hidden border bg-zinc-50 transition-all"
        :class="isCover(img) ? 'border-indigo-400 ring-1 ring-indigo-200' : 'border-zinc-200'"
      >
        <img
          :src="`/uploads/${img.file_path}`"
          :alt="img.file_name || ''"
          class="w-full h-full object-cover"
        />
        <!-- Cover badge -->
        <div v-if="isCover(img)" class="absolute top-1 left-1">
          <Star class="h-3.5 w-3.5 text-indigo-500 fill-indigo-500 drop-shadow-sm" />
        </div>
        <div class="absolute inset-0 bg-black/0 group-hover/img:bg-black/40 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover/img:opacity-100">
          <button
            type="button"
            class="h-7 w-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
            title="预览"
            @click="openPreview(`/uploads/${img.file_path}`)"
          >
            <ZoomIn class="h-3.5 w-3.5 text-zinc-700" />
          </button>
          <button
            v-if="!isCover(img)"
            type="button"
            class="h-7 w-7 rounded-full bg-indigo-500/90 flex items-center justify-center hover:bg-indigo-600 transition-colors"
            title="设为封面"
            @click.stop="setCover(img)"
          >
            <Star class="h-3.5 w-3.5 text-white" />
          </button>
          <button
            type="button"
            class="h-7 w-7 rounded-full bg-amber-500/90 flex items-center justify-center hover:bg-amber-600 transition-colors"
            title="废弃"
            @click.stop="toggleActive(img)"
          >
            <Ban class="h-3.5 w-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>

    <!-- Discarded images section -->
    <div v-if="showDiscarded && discardedImages.length" class="space-y-1.5">
      <p class="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">已废弃 ({{ discardedCount }})</p>
      <div class="grid gap-1.5" :class="compact ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'">
        <div
          v-for="img in discardedImages"
          :key="img.id"
          class="group/img relative aspect-square rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50 opacity-40 grayscale hover:opacity-70 hover:grayscale-0 transition-all"
        >
          <img
            :src="`/uploads/${img.file_path}`"
            :alt="img.file_name || ''"
            class="w-full h-full object-cover"
          />
          <div class="absolute top-1 right-1">
            <Badge variant="secondary" class="text-[9px] bg-zinc-800/70 text-zinc-200 border-0 px-1 py-0">废弃</Badge>
          </div>
          <div class="absolute inset-0 bg-black/0 group-hover/img:bg-black/40 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover/img:opacity-100">
            <button
              type="button"
              class="h-7 w-7 rounded-full bg-green-500/90 flex items-center justify-center hover:bg-green-600 transition-colors"
              title="恢复启用"
              @click.stop="toggleActive(img)"
            >
              <RotateCcw class="h-3.5 w-3.5 text-white" />
            </button>
            <button
              type="button"
              class="h-7 w-7 rounded-full bg-red-500/90 flex items-center justify-center hover:bg-red-600 transition-colors"
              title="彻底删除"
              @click.stop="deleteImage(img.id)"
            >
              <Trash2 class="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-2 flex-wrap">
      <input ref="inputRef" type="file" multiple accept="image/*" class="hidden" @change="onFileSelect" />
      <Button
        variant="outline"
        size="sm"
        class="gap-1.5 text-xs h-7"
        :disabled="uploading"
        @click="inputRef?.click()"
      >
        <Upload class="h-3 w-3" />
        {{ uploading ? '上传中...' : '上传图片' }}
      </Button>
      <button
        v-if="discardedCount > 0 || showDiscarded"
        type="button"
        class="text-[10px] text-zinc-400 hover:text-zinc-600 transition-colors"
        @click="showDiscarded = !showDiscarded"
      >
        {{ showDiscarded ? '隐藏废弃' : `显示废弃 (${discardedCount})` }}
      </button>
      <span v-if="!activeImages.length && !discardedCount" class="text-[10px] text-zinc-400">暂无图片</span>
    </div>

    <!-- Preview dialog with navigation -->
    <Dialog :open="showPreview" @update:open="(v: boolean) => { if (!v) showPreview = false }">
      <DialogContent class="max-w-3xl p-0 overflow-hidden">
        <div class="relative">
          <img :src="previewUrl" class="w-full h-auto max-h-[80vh] object-contain" alt="Preview" />
          <!-- Navigation arrows -->
          <button
            v-if="previewIndex > 0"
            type="button"
            class="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
            @click="prevImage"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button
            v-if="previewIndex < activeImages.length - 1"
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
            @click="nextImage"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        <!-- Info bar -->
        <div v-if="previewInfo" class="flex items-center justify-between px-4 py-2 bg-zinc-50 text-xs text-zinc-500 border-t border-zinc-100">
          <span class="truncate max-w-[60%]">{{ previewInfo.name }}</span>
          <span>{{ previewInfo.index }} / {{ previewInfo.total }}</span>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
