<script setup lang="ts">
import { UserCircle, ChevronDown, X } from 'lucide-vue-next'

const props = defineProps<{
  projectId: string
  modelValue: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', userId: string | null): void
}>()

const { $api } = useApi()
const open = ref(false)

const { data: members } = useAsyncData(
  `team-members-picker-${props.projectId}`,
  async () => {
    const project = await $api<{ team_id: string }>(`/api/projects/${props.projectId}`)
    return $api<Array<{ user_id: string; user_name: string; user_email: string }>>(`/api/teams/${project.team_id}/members`)
  },
)

const currentMember = computed(() =>
  members.value?.find(m => m.user_id === props.modelValue),
)

function select(userId: string | null) {
  emit('update:modelValue', userId)
  open.value = false
}
</script>

<template>
  <div class="relative">
    <button
      type="button"
      class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-sm transition-colors"
      @click="open = !open"
    >
      <template v-if="currentMember">
        <div class="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center shrink-0">
          <span class="text-[9px] font-semibold text-indigo-600">{{ currentMember.user_name?.charAt(0) || '?' }}</span>
        </div>
        <span class="text-zinc-700">{{ currentMember.user_name }}</span>
      </template>
      <template v-else>
        <UserCircle class="h-4 w-4 text-zinc-400" />
        <span class="text-zinc-400">未分配</span>
      </template>
      <ChevronDown class="h-3 w-3 text-zinc-400" />
    </button>

    <div v-if="open" class="fixed inset-0 z-20" @click="open = false" />

    <div
      v-if="open"
      class="absolute top-full mt-1 right-0 z-30 bg-white rounded-xl border border-zinc-200 shadow-lg w-52 py-1 max-h-60 overflow-auto"
    >
      <button
        type="button"
        class="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-50"
        @click="select(null)"
      >
        <X class="h-3.5 w-3.5" /> 取消分配
      </button>
      <div class="border-t border-zinc-100 my-1" />
      <button
        v-for="m in members"
        :key="m.user_id"
        type="button"
        class="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-indigo-50 transition-colors"
        :class="m.user_id === modelValue ? 'text-indigo-700 bg-indigo-50/50' : 'text-zinc-700'"
        @click="select(m.user_id)"
      >
        <div class="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center shrink-0">
          <span class="text-[10px] font-semibold text-indigo-600">{{ m.user_name?.charAt(0) || '?' }}</span>
        </div>
        {{ m.user_name }}
      </button>
    </div>
  </div>
</template>
