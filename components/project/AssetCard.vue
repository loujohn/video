<script setup lang="ts">
import type { Asset } from '~/core/types/asset'
import { Music, Video, Trash2 } from 'lucide-vue-next'

const props = defineProps<{ asset: Asset }>()
const emit = defineEmits<{ (e: 'click', asset: Asset): void; (e: 'delete', asset: Asset): void }>()

function formatSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

function truncate(str: string | null, max = 20): string {
  if (!str) return '—'
  return str.length > max ? str.slice(0, max) + '…' : str
}

const typeLabels: Record<string, string> = {
  image: '图片',
  audio: '音频',
  video: '视频',
}

function handleClick(e: MouseEvent) {
  if ((e.target as HTMLElement).closest('button')) return
  emit('click', props.asset)
}

function handleDelete(e: MouseEvent) {
  e.stopPropagation()
  emit('delete', props.asset)
}
</script>

<template>
  <div
    class="group relative rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer aspect-square"
    @click="handleClick"
  >
    <!-- Thumbnail / placeholder -->
    <div class="absolute inset-0">
      <img
        v-if="asset.type === 'image'"
        :src="`/uploads/${asset.file_path}`"
        :alt="asset.file_name || 'Image'"
        class="w-full h-full object-cover"
      />
      <div
        v-else
        class="w-full h-full flex items-center justify-center bg-zinc-100"
      >
        <Music v-if="asset.type === 'audio'" class="h-12 w-12 text-zinc-400" />
        <Video v-else class="h-12 w-12 text-zinc-400" />
      </div>
    </div>

    <!-- Delete button (hover) -->
    <Button
      variant="destructive"
      size="sm"
      class="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
      @click="handleDelete"
    >
      <Trash2 class="h-4 w-4" />
    </Button>

    <!-- Info overlay -->
    <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
      <p class="text-white text-sm font-medium truncate">
        {{ truncate(asset.file_name) }}
      </p>
      <div class="flex items-center gap-2 mt-1">
        <Badge variant="secondary" class="text-[10px] bg-white/20 text-white border-0">
          {{ typeLabels[asset.type] || asset.type }}
        </Badge>
        <span class="text-white/80 text-xs">{{ formatSize(asset.file_size) }}</span>
      </div>
    </div>
  </div>
</template>
