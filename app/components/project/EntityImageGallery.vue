<script setup lang="ts">
import { Upload, ZoomIn, Trash2, Ban, RotateCcw, Play, MessageSquare, Check, Copy, Pencil } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Asset } from '~/core/types/asset'

const props = withDefaults(defineProps<{
  projectId: string
  entityType: string
  entityId: string
  imagePrompt?: string | null
  compact?: boolean
  mediaType?: 'image' | 'video' | 'all'
  slot?: number | null
}>(), {
  mediaType: 'image',
  slot: null,
})

const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'cover-change', url: string | null): void
  (e: 'confirmed'): void
}>()
const { $api } = useApi()
const token = useCookie('token')

const showDiscarded = ref(false)

const isVideo = computed(() => props.mediaType === 'video')
const mediaLabel = computed(() => isVideo.value ? '视频' : '图片')

const assetsUrl = computed(() => {
  let base = `/api/projects/${props.projectId}/assets?linked_entity_type=${encodeURIComponent(props.entityType)}&linked_entity_id=${encodeURIComponent(props.entityId)}`
  if (props.mediaType !== 'all') base += `&type=${props.mediaType}`
  return showDiscarded.value ? `${base}&is_active=all` : base
})

const { data: assets, refresh } = useAsyncData(
  `entity-media-${props.mediaType}-${props.entityType}-${props.entityId}`,
  () => $api<Asset[]>(assetsUrl.value),
  { watch: [() => props.entityId, assetsUrl] },
)

const activeAssets = computed(() =>
  (assets.value ?? [])
    .filter(i => i.is_active)
    .filter(i => props.slot == null || (i.metadata as any)?.slot === props.slot)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
)
const discardedAssets = computed(() => (assets.value ?? []).filter(i => !i.is_active))
const discardedCount = computed(() => discardedAssets.value.length)

function isApproved(asset: Asset): boolean {
  return (asset.metadata as any)?.review_status === 'approved'
}

const hasConfirmedCover = computed(() => activeAssets.value.some(i => isApproved(i)))

const coverAsset = computed(() => {
  const active = activeAssets.value
  const approved = active.find(i => isApproved(i))
  return approved || active[0] || null
})

const commentCounts = ref<Record<string, number>>({})
const commentAsset = ref<Asset | null>(null)
const showCommentSheet = ref(false)

async function loadCommentCounts() {
  const ids = activeAssets.value.map(a => a.id)
  if (!ids.length) return
  try {
    const params = new URLSearchParams()
    params.set('entity_type', 'asset')
    ids.forEach(id => params.append('entity_ids', id))
    const data = await $api<Record<string, number>>(`/api/projects/${props.projectId}/comments/counts?${params}`)
    commentCounts.value = data ?? {}
  } catch {}
}

watch(activeAssets, loadCommentCounts, { immediate: true })

function openAssetComments(asset: Asset) {
  commentAsset.value = asset
  showCommentSheet.value = true
}

function getCommentCount(assetId: string): number {
  return commentCounts.value[assetId] || 0
}

const coverUrl = computed(() => coverAsset.value ? `/uploads/${coverAsset.value.file_path}` : null)

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
  const item = activeAssets.value[previewIndex.value]
  return item ? `/uploads/${item.file_path}` : ''
})

const previewItem = computed(() => activeAssets.value[previewIndex.value] ?? null)

const previewInfo = computed(() => {
  const item = activeAssets.value[previewIndex.value]
  return item ? { name: item.file_name || '未命名', index: previewIndex.value + 1, total: activeAssets.value.length } : null
})

function isAssetVideo(asset: Asset): boolean {
  return asset.type === 'video'
}

function openPreview(url: string) {
  const idx = activeAssets.value.findIndex(i => `/uploads/${i.file_path}` === url)
  previewIndex.value = idx >= 0 ? idx : 0
  showPreview.value = true
}

function prevAsset() {
  if (previewIndex.value > 0) { previewIndex.value--; editingPrompt.value = false }
}

function nextAsset() {
  if (previewIndex.value < activeAssets.value.length - 1) { previewIndex.value++; editingPrompt.value = false }
}

function isCover(asset: Asset): boolean {
  return isApproved(asset)
}

function getGenerationPrompt(asset: Asset): string | null {
  return (asset.metadata as any)?.generation_prompt || null
}

const expandedPrompts = ref<Set<string>>(new Set())
function togglePromptExpand(id: string) {
  const s = new Set(expandedPrompts.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  expandedPrompts.value = s
}

async function approveAsset(asset: Asset) {
  const currentStatus = (asset.metadata as any)?.review_status
  const newStatus = currentStatus === 'approved' ? 'pending' : 'approved'
  const newMeta = { ...(asset.metadata as any), review_status: newStatus }

  try {
    await $api(`/api/projects/${props.projectId}/assets/${asset.id}`, {
      method: 'PUT', body: { metadata: newMeta },
    })
    toast.success(newStatus === 'approved' ? '已审核通过' : '已取消审核')
    await refresh()
    emit('confirmed')
    emit('refresh')
  } catch { toast.error('操作失败') }
}

async function copyPrompt(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('已复制提示词')
  } catch { toast.error('复制失败') }
}

const editingPrompt = ref(false)
const promptDraft = ref('')

function startEditPrompt(asset: Asset) {
  promptDraft.value = getGenerationPrompt(asset) || ''
  editingPrompt.value = true
}

async function savePrompt(asset: Asset) {
  const newMeta = { ...(asset.metadata as any), generation_prompt: promptDraft.value || undefined }
  if (!promptDraft.value) delete newMeta.generation_prompt
  try {
    await $api(`/api/projects/${props.projectId}/assets/${asset.id}`, {
      method: 'PUT', body: { metadata: newMeta },
    })
    toast.success('提示词已保存')
    editingPrompt.value = false
    await refresh()
  } catch { toast.error('保存失败') }
}

function cancelEditPrompt() {
  editingPrompt.value = false
  promptDraft.value = ''
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

async function deleteAsset(assetId: string) {
  try {
    await $api(`/api/projects/${props.projectId}/assets/${assetId}`, { method: 'DELETE' })
    toast.success('已删除')
    await refresh()
    emit('refresh')
  } catch {
    toast.error('删除失败')
  }
}

const acceptTypes = computed(() => {
  if (props.mediaType === 'video') return 'video/*'
  if (props.mediaType === 'all') return 'image/*,video/*'
  return 'image/*'
})

async function uploadFiles(files: File[]) {
  if (!files.length) return
  let validFiles: File[]
  if (props.mediaType === 'video') {
    validFiles = files.filter(f => f.type.startsWith('video/'))
  } else if (props.mediaType === 'all') {
    validFiles = files.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'))
  } else {
    validFiles = files.filter(f => f.type.startsWith('image/'))
  }
  if (!validFiles.length) {
    toast.error(`请选择${mediaLabel.value}文件`)
    return
  }

  uploading.value = true
  totalFiles.value = validFiles.length
  uploadProgress.value = 0

  let successCount = 0
  for (const file of validFiles) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', 'reference')
    formData.append('linked_entity_type', props.entityType)
    formData.append('linked_entity_id', props.entityId)
    if (props.slot != null) {
      formData.append('metadata', JSON.stringify({ slot: props.slot }))
    }

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
  if (successCount > 0) toast.success(`已上传 ${successCount} 个${mediaLabel.value}`)
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
        <p class="text-xs text-indigo-600 font-medium">拖放{{ mediaLabel }}到此处</p>
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
    <div v-if="imagePrompt" class="rounded-lg bg-amber-50 border border-amber-200/60 px-3 py-2 flex items-start gap-2">
      <div class="flex-1 min-w-0">
        <p class="text-[10px] font-medium text-amber-600 uppercase tracking-wider mb-0.5">提示词 Prompt</p>
        <p class="text-xs text-amber-900 whitespace-pre-wrap line-clamp-3">{{ imagePrompt }}</p>
      </div>
      <button
        type="button"
        class="shrink-0 mt-1 p-1 rounded hover:bg-amber-100 transition-colors"
        title="复制提示词"
        @click="copyPrompt(imagePrompt!)"
      >
        <Copy class="h-3 w-3 text-amber-600" />
      </button>
    </div>

    <!-- Active assets grid -->
    <div v-if="activeAssets.length" class="grid gap-1.5" :class="compact ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'">
      <div
        v-for="item in activeAssets"
        :key="item.id"
        class="group/img relative rounded-lg overflow-hidden bg-zinc-50 transition-all"
        :class="[
          isCover(item) && hasConfirmedCover ? 'border-2 border-emerald-400 ring-1 ring-emerald-200' :
          'border border-zinc-200',
        ]"
      >
        <div class="relative aspect-square">
          <!-- Video thumbnail -->
          <template v-if="isAssetVideo(item)">
            <video
              :src="`/uploads/${item.file_path}`"
              class="w-full h-full object-cover"
              muted
              preload="metadata"
            />
            <div class="absolute bottom-1 right-1">
              <div class="h-5 w-5 rounded-full bg-black/60 flex items-center justify-center">
                <Play class="h-3 w-3 text-white fill-white" />
              </div>
            </div>
          </template>
          <!-- Image -->
          <template v-else>
            <img
              :src="`/uploads/${item.file_path}`"
              :alt="item.file_name || ''"
              class="w-full h-full object-cover"
            />
          </template>

          <!-- Review approved badge -->
          <div v-if="isCover(item)" class="absolute top-1 left-1">
            <div class="flex items-center gap-0.5 bg-emerald-500 text-white rounded-full px-1.5 py-0.5">
              <Check class="h-2.5 w-2.5" />
              <span class="text-[8px] font-medium">已审核</span>
            </div>
          </div>

          <!-- Comment count badge -->
          <button
            v-if="getCommentCount(item.id) > 0"
            type="button"
            class="absolute bottom-1 left-1 flex items-center gap-0.5 bg-black/60 text-white rounded-full px-1.5 py-0.5 text-[9px]"
            @click.stop="openAssetComments(item)"
          >
            <MessageSquare class="h-2.5 w-2.5" />
            {{ getCommentCount(item.id) }}
          </button>

          <!-- Hover actions -->
          <div class="absolute inset-0 bg-black/0 group-hover/img:bg-black/40 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover/img:opacity-100">
            <button
              type="button"
              class="h-7 w-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
              title="预览"
              @click="openPreview(`/uploads/${item.file_path}`)"
            >
              <ZoomIn class="h-3.5 w-3.5 text-zinc-700" />
            </button>
            <button
              type="button"
              class="h-7 w-7 rounded-full flex items-center justify-center transition-colors"
              :class="isCover(item) ? 'bg-amber-500/90 hover:bg-amber-600' : 'bg-emerald-500/90 hover:bg-emerald-600'"
              :title="isCover(item) ? '取消审核' : '审核通过'"
              @click.stop="approveAsset(item)"
            >
              <Check class="h-3.5 w-3.5 text-white" />
            </button>
            <button
              type="button"
              class="h-7 w-7 rounded-full bg-blue-500/90 flex items-center justify-center hover:bg-blue-600 transition-colors"
              title="评论"
              @click.stop="openAssetComments(item)"
            >
              <MessageSquare class="h-3.5 w-3.5 text-white" />
            </button>
            <button
              type="button"
              class="h-7 w-7 rounded-full bg-amber-500/90 flex items-center justify-center hover:bg-amber-600 transition-colors"
              title="废弃"
              @click.stop="toggleActive(item)"
            >
              <Ban class="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        </div>

        <!-- Generation prompt below image (click to open preview for editing) -->
        <div v-if="getGenerationPrompt(item)" class="px-1.5 py-1 border-t border-zinc-100">
          <p
            class="text-[10px] text-zinc-500 cursor-pointer hover:text-zinc-700 transition-colors"
            :class="expandedPrompts.has(item.id) ? '' : 'line-clamp-2'"
            @click.stop="togglePromptExpand(item.id)"
          >
            {{ getGenerationPrompt(item) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Discarded assets section -->
    <div v-if="showDiscarded && discardedAssets.length" class="space-y-1.5">
      <p class="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">已废弃 ({{ discardedCount }})</p>
      <div class="grid gap-1.5" :class="compact ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'">
        <div
          v-for="item in discardedAssets"
          :key="item.id"
          class="group/img relative aspect-square rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50 opacity-40 grayscale hover:opacity-70 hover:grayscale-0 transition-all"
        >
          <template v-if="isAssetVideo(item)">
            <video :src="`/uploads/${item.file_path}`" class="w-full h-full object-cover" muted preload="metadata" />
          </template>
          <template v-else>
            <img :src="`/uploads/${item.file_path}`" :alt="item.file_name || ''" class="w-full h-full object-cover" />
          </template>
          <div class="absolute top-1 right-1">
            <Badge variant="secondary" class="text-[9px] bg-zinc-800/70 text-zinc-200 border-0 px-1 py-0">废弃</Badge>
          </div>
          <div class="absolute inset-0 bg-black/0 group-hover/img:bg-black/40 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover/img:opacity-100">
            <button
              type="button"
              class="h-7 w-7 rounded-full bg-green-500/90 flex items-center justify-center hover:bg-green-600 transition-colors"
              title="恢复启用"
              @click.stop="toggleActive(item)"
            >
              <RotateCcw class="h-3.5 w-3.5 text-white" />
            </button>
            <button
              type="button"
              class="h-7 w-7 rounded-full bg-red-500/90 flex items-center justify-center hover:bg-red-600 transition-colors"
              title="彻底删除"
              @click.stop="deleteAsset(item.id)"
            >
              <Trash2 class="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-2 flex-wrap">
      <input ref="inputRef" type="file" multiple :accept="acceptTypes" class="hidden" @change="onFileSelect" />
      <Button
        variant="outline"
        size="sm"
        class="gap-1.5 text-xs h-7"
        :disabled="uploading"
        @click="inputRef?.click()"
      >
        <Upload class="h-3 w-3" />
        {{ uploading ? '上传中...' : `上传${mediaLabel}` }}
      </Button>
      <button
        v-if="discardedCount > 0 || showDiscarded"
        type="button"
        class="text-[10px] text-zinc-400 hover:text-zinc-600 transition-colors"
        @click="showDiscarded = !showDiscarded"
      >
        {{ showDiscarded ? '隐藏废弃' : `显示废弃 (${discardedCount})` }}
      </button>
      <span v-if="!activeAssets.length && !discardedCount" class="text-[10px] text-zinc-400">暂无{{ mediaLabel }}</span>
    </div>

    <!-- Comment Sheet -->
    <Sheet :open="showCommentSheet" @update:open="(v: boolean) => { if (!v) { showCommentSheet = false; loadCommentCounts() } }">
      <SheetContent side="right" class="w-[400px] sm:w-[440px]">
        <SheetHeader>
          <SheetTitle>{{ mediaLabel }}评论</SheetTitle>
        </SheetHeader>
        <div class="mt-4">
          <CommonCommentThread
            v-if="commentAsset"
            :project-id="projectId"
            entity-type="asset"
            :entity-id="commentAsset.id"
          />
        </div>
      </SheetContent>
    </Sheet>

    <!-- Preview dialog with navigation -->
    <Dialog :open="showPreview" @update:open="(v: boolean) => { if (!v) showPreview = false }">
      <DialogContent class="max-w-3xl p-0 overflow-hidden">
        <div class="relative">
          <template v-if="previewItem && isAssetVideo(previewItem)">
            <video :src="previewUrl" class="w-full h-auto max-h-[80vh]" controls autoplay />
          </template>
          <template v-else>
            <img :src="previewUrl" class="w-full h-auto max-h-[80vh] object-contain" alt="Preview" />
          </template>
          <!-- Navigation arrows -->
          <button
            v-if="previewIndex > 0"
            type="button"
            class="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
            @click="prevAsset"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button
            v-if="previewIndex < activeAssets.length - 1"
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
            @click="nextAsset"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        <!-- Info bar with actions -->
        <div v-if="previewInfo && previewItem" class="flex items-center justify-between px-4 py-2 bg-zinc-50 text-xs text-zinc-500 border-t border-zinc-100">
          <span class="truncate max-w-[40%]">{{ previewInfo.name }}</span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-1 text-[10px] font-medium"
              :class="isCover(previewItem!) ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'"
              @click="approveAsset(previewItem!)"
            >
              <Check class="h-2.5 w-2.5" /> {{ isCover(previewItem!) ? '取消审核' : '审核通过' }}
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1 text-[10px] text-amber-600 hover:text-amber-700 font-medium"
              @click="toggleActive(previewItem!); showPreview = false"
            >
              <Ban class="h-2.5 w-2.5" /> 废弃
            </button>
          </div>
          <span>{{ previewInfo.index }} / {{ previewInfo.total }}</span>
        </div>
        <!-- Prompt panel in preview -->
        <div v-if="previewItem" class="px-4 py-3 bg-zinc-50 border-t border-zinc-100">
          <template v-if="editingPrompt">
            <div class="flex items-center justify-between mb-1.5">
              <p class="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">编辑提示词</p>
            </div>
            <textarea
              v-model="promptDraft"
              class="w-full text-xs border border-zinc-300 rounded-md px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-y min-h-[60px]"
              rows="3"
              placeholder="输入该图片的生成提示词..."
            />
            <div class="flex items-center gap-2 mt-2">
              <Button size="sm" class="text-xs h-6 px-3" @click="savePrompt(previewItem!)">保存</Button>
              <Button variant="ghost" size="sm" class="text-xs h-6 px-3" @click="cancelEditPrompt">取消</Button>
            </div>
          </template>
          <template v-else-if="getGenerationPrompt(previewItem)">
            <div class="flex items-center justify-between mb-1">
              <p class="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Generation Prompt</p>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="inline-flex items-center gap-1 text-[10px] text-zinc-500 hover:text-indigo-600 font-medium"
                  @click="startEditPrompt(previewItem!)"
                >
                  <Pencil class="h-2.5 w-2.5" /> 编辑
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-700 font-medium"
                  @click="copyPrompt(getGenerationPrompt(previewItem!)!)"
                >
                  <Copy class="h-2.5 w-2.5" /> 复制
                </button>
              </div>
            </div>
            <p class="text-xs text-zinc-700 whitespace-pre-wrap">{{ getGenerationPrompt(previewItem) }}</p>
          </template>
          <template v-else>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-indigo-600 transition-colors"
              @click="startEditPrompt(previewItem!)"
            >
              <Pencil class="h-3 w-3" /> 添加提示词
            </button>
          </template>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
