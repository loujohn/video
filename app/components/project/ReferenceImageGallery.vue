<script setup lang="ts">
import { Upload, ZoomIn, Trash2, ImageIcon } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Asset } from '~/core/types/asset'

const props = defineProps<{
  projectId: string
  entityType: string
  entityId: string
}>()

const { $api } = useApi()
const token = useCookie('token')

const assetsUrl = computed(() =>
  `/api/projects/${props.projectId}/assets?linked_entity_type=${encodeURIComponent(props.entityType)}&linked_entity_id=${encodeURIComponent(props.entityId)}&category=reference_input`,
)

const { data: assets, refresh } = useAsyncData(
  `ref-img-${props.entityType}-${props.entityId}`,
  () => $api<Asset[]>(assetsUrl.value),
  { watch: [() => props.entityId] },
)

const images = computed(() => (assets.value ?? []).filter(i => i.is_active))

const inputRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const dragOver = ref(false)
const previewUrl = ref('')
const showPreview = ref(false)

function openPreview(url: string) {
  previewUrl.value = url
  showPreview.value = true
}

async function uploadFiles(files: File[]) {
  const valid = files.filter(f => f.type.startsWith('image/'))
  if (!valid.length) { toast.error('请选择图片文件'); return }
  uploading.value = true
  let ok = 0
  for (const file of valid) {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('category', 'reference_input')
    fd.append('linked_entity_type', props.entityType)
    fd.append('linked_entity_id', props.entityId)
    try {
      await $fetch(`/api/projects/${props.projectId}/assets`, {
        method: 'POST', body: fd,
        headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
      })
      ok++
    } catch {}
  }
  uploading.value = false
  if (ok > 0) toast.success(`已上传 ${ok} 张参考图`)
  else toast.error('上传失败')
  await refresh()
}

async function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  await uploadFiles(Array.from(input.files ?? []))
  input.value = ''
}

async function deleteRef(id: string) {
  try {
    await $api(`/api/projects/${props.projectId}/assets/${id}`, { method: 'DELETE' })
    toast.success('已删除')
    await refresh()
  } catch { toast.error('删除失败') }
}

function onDrop(e: DragEvent) {
  e.preventDefault(); dragOver.value = false
  uploadFiles(Array.from(e.dataTransfer?.files ?? []))
}
</script>

<template>
  <div
    class="space-y-2 relative rounded-lg transition-all"
    :class="dragOver ? 'ring-2 ring-blue-400 ring-offset-2 bg-blue-50/50' : ''"
    @drop="onDrop"
    @dragover.prevent="dragOver = true"
    @dragleave="dragOver = false"
  >
    <div
      v-if="dragOver"
      class="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-blue-50/80 border-2 border-dashed border-blue-400 pointer-events-none"
    >
      <div class="text-center">
        <Upload class="h-6 w-6 text-blue-500 mx-auto mb-1" />
        <p class="text-xs text-blue-600 font-medium">拖放参考图到此处</p>
      </div>
    </div>

    <div v-if="images.length" class="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
      <div
        v-for="item in images"
        :key="item.id"
        class="group/ref relative aspect-square rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50"
      >
        <img :src="`/uploads/${item.file_path}`" :alt="item.file_name || ''" class="w-full h-full object-cover" />
        <div class="absolute inset-0 bg-black/0 group-hover/ref:bg-black/40 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover/ref:opacity-100">
          <button
            type="button"
            class="h-7 w-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-white"
            @click="openPreview(`/uploads/${item.file_path}`)"
          >
            <ZoomIn class="h-3.5 w-3.5 text-zinc-700" />
          </button>
          <button
            type="button"
            class="h-7 w-7 rounded-full bg-red-500/90 flex items-center justify-center hover:bg-red-600"
            @click="deleteRef(item.id)"
          >
            <Trash2 class="h-3.5 w-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>

    <div v-else class="flex items-center gap-2 text-xs text-zinc-400 py-2">
      <ImageIcon class="h-4 w-4" />
      <span>暂无参考图</span>
    </div>

    <div>
      <input ref="inputRef" type="file" multiple accept="image/*" class="hidden" @change="onFileSelect" />
      <Button variant="outline" size="sm" class="gap-1.5 text-xs h-7" :disabled="uploading" @click="inputRef?.click()">
        <Upload class="h-3 w-3" />
        {{ uploading ? '上传中...' : '上传参考图' }}
      </Button>
    </div>

    <Dialog :open="showPreview" @update:open="(v: boolean) => { if (!v) showPreview = false }">
      <DialogContent class="max-w-3xl p-0 overflow-hidden">
        <img :src="previewUrl" class="w-full h-auto max-h-[80vh] object-contain" alt="Preview" />
      </DialogContent>
    </Dialog>
  </div>
</template>
