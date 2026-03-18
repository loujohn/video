<script setup lang="ts">
import { Upload, ZoomIn, Trash2 } from 'lucide-vue-next'
import type { Asset } from '~/core/types/asset'

const props = defineProps<{
  projectId: string
  entityType: string
  entityId: string
  imagePrompt?: string | null
}>()

const emit = defineEmits<{ (e: 'refresh'): void }>()
const { $api } = useApi()
const token = useCookie('token')

const assetsUrl = computed(
  () =>
    `/api/projects/${props.projectId}/assets?linked_entity_type=${encodeURIComponent(props.entityType)}&linked_entity_id=${encodeURIComponent(props.entityId)}&type=image`,
)

const { data: images, refresh } = useAsyncData(
  `entity-images-${props.entityType}-${props.entityId}`,
  () => $api<Asset[]>(assetsUrl.value),
  { watch: [() => props.entityId, assetsUrl] },
)

const previewUrl = ref('')
const showPreview = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

function openPreview(url: string) {
  previewUrl.value = url
  showPreview.value = true
}

async function deleteImage(assetId: string) {
  try {
    await $api(`/api/projects/${props.projectId}/assets/${assetId}`, { method: 'DELETE' })
    await refresh()
    emit('refresh')
  } catch {}
}

async function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (!files.length) return

  uploading.value = true
  for (const file of files) {
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
    } catch {}
  }
  uploading.value = false
  await refresh()
  emit('refresh')
}
</script>

<template>
  <div class="space-y-3">
    <!-- Image prompt display -->
    <div v-if="imagePrompt" class="rounded-lg bg-amber-50 border border-amber-200/60 px-3 py-2">
      <p class="text-[10px] font-medium text-amber-600 uppercase tracking-wider mb-1">提示词 Prompt</p>
      <p class="text-sm text-amber-900 whitespace-pre-wrap">{{ imagePrompt }}</p>
    </div>

    <!-- Image grid -->
    <div v-if="images?.length" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2">
      <div
        v-for="img in images"
        :key="img.id"
        class="group relative aspect-square rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50"
      >
        <img
          :src="`/uploads/${img.file_path}`"
          :alt="img.file_name || ''"
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button
            type="button"
            class="h-8 w-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
            @click="openPreview(`/uploads/${img.file_path}`)"
          >
            <ZoomIn class="h-4 w-4 text-zinc-700" />
          </button>
          <button
            type="button"
            class="h-8 w-8 rounded-full bg-red-500/90 flex items-center justify-center hover:bg-red-600 transition-colors"
            @click.stop="deleteImage(img.id)"
          >
            <Trash2 class="h-4 w-4 text-white" />
          </button>
        </div>
      </div>
    </div>

    <!-- Upload button -->
    <div class="flex items-center gap-2">
      <input ref="inputRef" type="file" multiple accept="image/*" class="hidden" @change="onFileSelect" />
      <Button
        variant="outline"
        size="sm"
        class="gap-2 text-xs"
        :disabled="uploading"
        @click="inputRef?.click()"
      >
        <Upload class="h-3 w-3" />
        {{ uploading ? '上传中...' : '上传图片' }}
      </Button>
      <span v-if="!images?.length" class="text-xs text-zinc-400">暂无关联图片</span>
    </div>

    <!-- Preview dialog -->
    <Dialog :open="showPreview" @update:open="(v: boolean) => { if (!v) showPreview = false }">
      <DialogContent class="max-w-3xl p-0 overflow-hidden">
        <img :src="previewUrl" class="w-full h-auto max-h-[80vh] object-contain" alt="Preview" />
      </DialogContent>
    </Dialog>
  </div>
</template>
