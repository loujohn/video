<script setup lang="ts">
import { History, ChevronDown, ChevronRight } from 'lucide-vue-next'

interface EntityVersion {
  id: string
  entity_type: string
  entity_id: string
  version_number: number
  snapshot: Record<string, unknown>
  change_summary: string | null
  created_by: string | null
  created_at: string
}

const props = defineProps<{
  projectId: string
  entityType: string
  entityId: string
  open: boolean
}>()

const emit = defineEmits<{ close: [] }>()

const { $api } = useApi()

const versions = ref<EntityVersion[]>([])
const loading = ref(false)
const fetchError = ref('')
const expandedId = ref<string | null>(null)

async function fetchVersions() {
  if (!props.projectId || !props.entityType || !props.entityId) return
  loading.value = true
  fetchError.value = ''
  try {
    const result = await $api<EntityVersion[]>(
      `/api/projects/${props.projectId}/versions?entity_type=${encodeURIComponent(props.entityType)}&entity_id=${encodeURIComponent(props.entityId)}`,
    )
    versions.value = result ?? []
    expandedId.value = null
  } catch (e: any) {
    versions.value = []
    fetchError.value = e.data?.statusMessage || '加载版本历史失败'
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.open, props.entityId] as const,
  ([open]) => {
    if (open) fetchVersions()
  },
  { immediate: true },
)

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function formatSnapshot(snapshot: Record<string, unknown>): string {
  try {
    return JSON.stringify(snapshot, null, 2)
  } catch {
    return String(snapshot)
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function operatorName(version: EntityVersion) {
  if (!version.created_by) return '—'
  return version.created_by.length > 12
    ? version.created_by.slice(0, 8) + '...'
    : version.created_by
}
</script>

<template>
  <Sheet :open="open" @update:open="(v: boolean) => { if (!v) emit('close') }">
    <SheetContent class="w-full sm:max-w-md overflow-y-auto">
      <SheetHeader>
        <SheetTitle class="flex items-center gap-2">
          <History class="h-5 w-5 text-indigo-600" />
          版本历史
        </SheetTitle>
      </SheetHeader>

      <div v-if="loading" class="flex items-center justify-center py-12">
        <span class="text-sm text-zinc-500">加载中...</span>
      </div>

      <div v-else-if="fetchError" class="py-12 text-center text-sm text-red-500">
        {{ fetchError }}
      </div>

      <div v-else-if="!versions.length" class="py-12 text-center text-sm text-zinc-500">
        暂无版本记录
      </div>

      <div v-else class="mt-4 space-y-2">
        <div
          v-for="v in versions"
          :key="v.id"
          class="rounded-lg border border-zinc-200/60 bg-white shadow-sm overflow-hidden"
        >
          <button
            type="button"
            class="w-full flex items-center gap-3 p-3 text-left hover:bg-zinc-50 transition-colors"
            @click="toggleExpand(v.id)"
          >
            <component
              :is="expandedId === v.id ? ChevronDown : ChevronRight"
              class="h-4 w-4 shrink-0 text-zinc-400"
            />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold text-zinc-900">v{{ v.version_number }}</span>
                <span class="text-xs text-zinc-500">{{ formatDate(v.created_at) }}</span>
              </div>
              <p class="text-xs text-zinc-600 mt-0.5 truncate">
                {{ v.change_summary || '无变更说明' }}
              </p>
              <p class="text-xs text-zinc-400 mt-0.5">操作员: {{ operatorName(v) }}</p>
            </div>
          </button>
          <div
            v-if="expandedId === v.id"
            class="border-t border-zinc-100 bg-zinc-50/50 p-3"
          >
            <pre class="text-xs text-zinc-700 overflow-x-auto whitespace-pre-wrap wrap-break-word font-mono max-h-64 overflow-y-auto">{{ formatSnapshot(v.snapshot) }}</pre>
          </div>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>
