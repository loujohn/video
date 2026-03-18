<script setup lang="ts">
import type { Asset } from '~/core/types/asset'

const props = defineProps<{
  open: boolean
  asset: Asset | null
}>()
const emit = defineEmits<{ (e: 'close'): void }>()

function formatSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

const typeLabels: Record<string, string> = {
  image: '图片',
  audio: '音频',
  video: '视频',
}

function formatDate(d: Date | string | null): string {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <Dialog :open="open" @update:open="(v: boolean) => { if (!v) emit('close') }">
    <DialogContent class="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ asset?.file_name || '预览' }}</DialogTitle>
      </DialogHeader>
      <div v-if="asset" class="space-y-4">
        <!-- Preview content -->
        <div class="flex justify-center bg-zinc-100 rounded-lg overflow-hidden min-h-[200px]">
          <img
            v-if="asset.type === 'image'"
            :src="`/uploads/${asset.file_path}`"
            :alt="asset.file_name || 'Image'"
            class="max-w-full max-h-[60vh] object-contain"
          />
          <audio
            v-else-if="asset.type === 'audio'"
            :src="`/uploads/${asset.file_path}`"
            controls
            class="w-full"
          />
          <video
            v-else-if="asset.type === 'video'"
            :src="`/uploads/${asset.file_path}`"
            controls
            class="max-w-full max-h-[60vh]"
          />
        </div>

        <!-- Metadata -->
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span class="text-zinc-500">文件名</span>
            <p class="font-medium text-zinc-900 truncate">{{ asset.file_name || '—' }}</p>
          </div>
          <div>
            <span class="text-zinc-500">大小</span>
            <p class="font-medium text-zinc-900">{{ formatSize(asset.file_size) }}</p>
          </div>
          <div>
            <span class="text-zinc-500">类型</span>
            <p class="font-medium text-zinc-900">{{ typeLabels[asset.type] || asset.type }}</p>
          </div>
          <div>
            <span class="text-zinc-500">上传时间</span>
            <p class="font-medium text-zinc-900">{{ formatDate(asset.created_at) }}</p>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
