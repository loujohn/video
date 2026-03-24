<script setup lang="ts">
import { ChevronDown, Plus, Folder } from 'lucide-vue-next'
import type { Project } from '~/core/types'

interface Props {
  modelValue: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const { $api } = useApi()
const open = ref(false)
const projects = ref<Project[]>([])

onMounted(async () => {
  try {
    projects.value = await $api<Project[]>('/api/projects')
  }
  catch { /* ignore */ }
})

const selected = computed(() => {
  if (!props.modelValue) return null
  return projects.value.find(p => p.id === props.modelValue) || null
})

function select(id: string | null) {
  emit('update:modelValue', id)
  open.value = false
}
</script>

<template>
  <div class="relative">
    <button
      class="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-zinc-200 bg-white hover:border-indigo-400 transition-colors"
      @click="open = !open"
    >
      <Folder class="h-3 w-3 text-zinc-400" />
      <span class="text-zinc-600 max-w-[120px] truncate">
        {{ selected?.title || '选择项目...' }}
      </span>
      <ChevronDown class="h-3 w-3 text-zinc-400" />
    </button>

    <div
      v-if="open"
      class="absolute top-full mt-1 left-0 w-56 bg-white border border-zinc-200 rounded-lg shadow-lg z-20 py-1 max-h-60 overflow-y-auto"
    >
      <button
        class="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 text-zinc-400"
        @click="select(null)"
      >
        无（通过对话自动关联）
      </button>
      <div class="border-t border-zinc-100 my-1" />
      <button
        v-for="p in projects"
        :key="p.id"
        :class="[
          'w-full text-left px-3 py-2 text-xs hover:bg-zinc-50',
          p.id === modelValue ? 'text-indigo-600 bg-indigo-50' : 'text-zinc-700',
        ]"
        @click="select(p.id)"
      >
        {{ p.title }}
      </button>
      <div v-if="!projects.length" class="px-3 py-2 text-xs text-zinc-400">暂无项目</div>
    </div>

    <div v-if="open" class="fixed inset-0 z-10" @click="open = false" />
  </div>
</template>
