<script setup lang="ts">
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-vue-next'

export interface HeroItem {
  id: string
  name: string
  imageUrl: string | null
  reviewStatus: string
  hasConfirmedCover?: boolean
}

const props = defineProps<{
  items: HeroItem[]
}>()

const emit = defineEmits<{
  (e: 'click', itemId: string): void
}>()

const scrollRef = ref<HTMLDivElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

function checkScroll() {
  const el = scrollRef.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 0
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}

function scroll(dir: 'left' | 'right') {
  scrollRef.value?.scrollBy({ left: dir === 'left' ? -240 : 240, behavior: 'smooth' })
}

onMounted(() => { nextTick(checkScroll) })

const statusConfig: Record<string, { label: string; class: string }> = {
  pending: { label: '待审核', class: 'bg-amber-100 text-amber-700' },
  approved: { label: '已通过', class: 'bg-emerald-100 text-emerald-700' },
}
</script>

<template>
  <div v-if="items.length" class="relative">
    <button
      v-if="canScrollLeft"
      type="button"
      class="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/90 border border-zinc-200 shadow flex items-center justify-center hover:bg-white"
      @click="scroll('left')"
    >
      <ChevronLeft class="h-4 w-4" />
    </button>
    <button
      v-if="canScrollRight"
      type="button"
      class="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/90 border border-zinc-200 shadow flex items-center justify-center hover:bg-white"
      @click="scroll('right')"
    >
      <ChevronRight class="h-4 w-4" />
    </button>

    <div
      ref="scrollRef"
      class="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
      @scroll="checkScroll"
    >
      <div
        v-for="item in items"
        :key="item.id"
        class="flex-shrink-0 w-48 cursor-pointer group"
        @click="emit('click', item.id)"
      >
        <div
          class="aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all"
          :class="[
            item.reviewStatus === 'approved' ? 'border-emerald-400' :
            item.reviewStatus === 'pending' ? 'border-amber-400' :
            'border-zinc-200',
            'group-hover:shadow-lg group-hover:scale-[1.02]',
          ]"
        >
          <img
            v-if="item.imageUrl"
            :src="item.imageUrl"
            :alt="item.name"
            class="w-full h-full object-cover"
          />
          <div
            v-else
            class="w-full h-full bg-zinc-100 flex flex-col items-center justify-center gap-1"
          >
            <ImageOff class="h-6 w-6 text-zinc-300" />
            <span class="text-[10px] text-zinc-400">暂无图片</span>
          </div>
        </div>

        <div class="mt-2 flex items-center gap-1.5">
          <span class="text-sm font-medium text-zinc-700 truncate">{{ item.name }}</span>
          <span
            v-if="statusConfig[item.reviewStatus]"
            class="text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap"
            :class="statusConfig[item.reviewStatus]?.class"
          >
            {{ statusConfig[item.reviewStatus]?.label }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
