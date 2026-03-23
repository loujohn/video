<script setup lang="ts">
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-vue-next'

export interface ThumbnailItem {
  id: string
  name: string
  coverUrl?: string | null
  reviewStatus?: string | null
}

const props = withDefaults(defineProps<{
  items: ThumbnailItem[]
  maxVisible?: number
  size?: 'sm' | 'md'
  unconfirmedIds?: string[]
}>(), {
  maxVisible: 5,
  size: 'md',
  unconfirmedIds: () => [],
})

const emit = defineEmits<{
  (e: 'select', item: ThumbnailItem): void
}>()

const page = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(props.items.length / props.maxVisible)))
const visibleItems = computed(() => {
  const start = page.value * props.maxVisible
  return props.items.slice(start, start + props.maxVisible)
})
const hasPrev = computed(() => page.value > 0)
const hasNext = computed(() => page.value < totalPages.value - 1)

function prev() {
  if (hasPrev.value) page.value--
}
function next() {
  if (hasNext.value) page.value++
}

function isUnconfirmed(id: string) {
  return props.unconfirmedIds.includes(id)
}

const thumbSize = computed(() => props.size === 'sm' ? 'h-12 w-12' : 'h-16 w-16')
const thumbImgSize = computed(() => props.size === 'sm' ? 'h-10 w-10' : 'h-14 w-14')
</script>

<template>
  <div class="flex items-center gap-1">
    <button
      v-if="hasPrev"
      type="button"
      class="shrink-0 h-6 w-6 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
      @click.stop="prev"
    >
      <ChevronLeft class="h-3.5 w-3.5 text-zinc-500" />
    </button>

    <div class="flex items-center gap-2 overflow-hidden">
      <button
        v-for="item in visibleItems"
        :key="item.id"
        type="button"
        class="flex flex-col items-center gap-0.5 shrink-0 group"
        @click.stop="emit('select', item)"
      >
        <div class="relative">
          <div
            class="rounded-lg overflow-hidden bg-zinc-100 flex items-center justify-center transition-all group-hover:ring-2 group-hover:ring-indigo-300"
            :class="[
              thumbSize,
              isUnconfirmed(item.id) ? 'border-2 border-dashed border-amber-400' : 'border border-zinc-200',
            ]"
          >
            <img
              v-if="item.coverUrl"
              :src="item.coverUrl"
              :alt="item.name"
              class="object-cover rounded-md"
              :class="thumbImgSize"
            />
            <ImageIcon v-else class="h-5 w-5 text-zinc-300" />
          </div>
          <div v-if="item.reviewStatus === 'confirmed'" class="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white z-10" />
          <div v-else-if="item.reviewStatus === 'in_review'" class="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-amber-400 border-2 border-white z-10" />
        </div>
        <span class="text-[9px] text-zinc-500 max-w-[4rem] truncate leading-tight">{{ item.name }}</span>
      </button>
    </div>

    <button
      v-if="hasNext"
      type="button"
      class="shrink-0 h-6 w-6 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
      @click.stop="next"
    >
      <ChevronRight class="h-3.5 w-3.5 text-zinc-500" />
    </button>
  </div>
</template>
