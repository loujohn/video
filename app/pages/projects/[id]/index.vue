<script setup lang="ts">
import { Users, ListOrdered, MapPin, Pencil, Download } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Character, Episode, Scene } from '~/core/types'
import type { ProjectWithProgress } from '~/core/types/project'

const route = useRoute()
const projectId = route.params.id as string
const { $api } = useApi()

const { data: project, status: projectStatus, error: projectError, refresh: refreshProject } = useAsyncData(`project-${projectId}`, () =>
  $api<ProjectWithProgress>(`/api/projects/${projectId}`),
)

const showEdit = ref(false)

useHead({ title: computed(() => project.value ? `${project.value.title} - 概览` : '项目详情') })

function handleUpdated() {
  refreshProject()
}

const { data: characters } = useAsyncData(`chars-${projectId}`, () =>
  $api<Character[]>(`/api/projects/${projectId}/characters`),
)

const { data: episodes } = useAsyncData(`eps-${projectId}`, () =>
  $api<Episode[]>(`/api/projects/${projectId}/episodes`),
)

const { data: scenes } = useAsyncData(`scenes-${projectId}`, () =>
  $api<Scene[]>(`/api/projects/${projectId}/scenes`),
)

const statusMap = PROJECT_STATUS_MAP
const exportLoading = ref(false)

async function exportProject(format: 'json' | 'markdown') {
  exportLoading.value = true
  try {
    const url = `/api/projects/${projectId}/export?format=${format}`
    if (format === 'markdown') {
      const text = await $api<string>(url, { responseType: 'text' } as any)
      const blob = new Blob([text as unknown as string], { type: 'text/markdown' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${project.value?.title || 'project'}.md`
      a.click()
      URL.revokeObjectURL(a.href)
    } else {
      const data = await $api(url)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${project.value?.title || 'project'}.json`
      a.click()
      URL.revokeObjectURL(a.href)
    }
    toast.success('导出成功')
  } catch {
    toast.error('导出失败')
  } finally {
    exportLoading.value = false
  }
}

const stats = computed(() => [
  { label: '角色', value: characters.value?.length || 0, icon: Users },
  { label: '分集', value: episodes.value?.length || 0, icon: ListOrdered },
  { label: '场景', value: scenes.value?.length || 0, icon: MapPin },
])
</script>

<template>
  <LayoutAppLayout>
    <template #title>{{ project?.title || '项目详情' }}</template>

    <CommonPageLoading v-if="projectStatus === 'pending'" />
    <CommonPageError v-else-if="projectError" :error="projectError" :retry-fn="refreshProject" />
    <div class="max-w-5xl" v-else-if="project">
      <ProjectSubNav :project-id="projectId" />

      <div class="space-y-6">
        <div class="bg-white rounded-2xl border border-zinc-200/60 p-6 shadow-sm">
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-xl font-bold text-zinc-900">{{ project.title }}</h2>
                <Button variant="ghost" size="sm" class="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-600" @click="showEdit = true">
                  <Pencil class="h-4 w-4" />
                </Button>
              </div>
              <div class="flex items-center gap-3 mt-2 text-sm text-zinc-500">
                <span>{{ (project.genre || []).join(' · ') || '未设置题材' }}</span>
                <span>·</span>
                <span>{{ project.audience || '未设置受众' }}</span>
                <span>·</span>
                <span>{{ project.total_episodes }}集</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  class="gap-1.5 text-xs"
                  :disabled="exportLoading"
                  @click="exportProject('markdown')"
                >
                  <Download class="h-3 w-3" /> Markdown
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  class="gap-1.5 text-xs"
                  :disabled="exportLoading"
                  @click="exportProject('json')"
                >
                  <Download class="h-3 w-3" /> JSON
                </Button>
              </div>
              <Badge
                :class="statusMap[project.status]?.color"
                variant="secondary"
              >
                {{ statusMap[project.status]?.label || project.status }}
              </Badge>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="bg-white rounded-xl border border-zinc-200/60 p-5 shadow-sm"
          >
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center">
                <component :is="stat.icon" class="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p class="text-2xl font-bold text-zinc-900">{{ stat.value }}</p>
                <p class="text-xs text-zinc-500">{{ stat.label }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="project.progress" class="bg-white rounded-2xl border border-zinc-200/60 p-6 shadow-sm">
          <ProjectProgressPanel :progress="project.progress" detailed />
        </div>

        <div class="bg-white rounded-2xl border border-zinc-200/60 p-6 shadow-sm">
          <h3 class="text-sm font-semibold text-zinc-900 mb-4">项目信息</h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p class="text-zinc-400">调性</p>
              <p class="font-medium text-zinc-800">{{ project.tone || '—' }}</p>
            </div>
            <div>
              <p class="text-zinc-400">结局类型</p>
              <p class="font-medium text-zinc-800">{{ project.ending_type || '—' }}</p>
            </div>
            <div>
              <p class="text-zinc-400">语言</p>
              <p class="font-medium text-zinc-800">{{ project.language || '—' }}</p>
            </div>
            <div>
              <p class="text-zinc-400">模式</p>
              <p class="font-medium text-zinc-800">{{ project.mode === 'domestic' ? '国内' : '出海' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ProjectEditProjectDialog :open="showEdit" :project="project" @updated="handleUpdated" @close="showEdit = false" />
  </LayoutAppLayout>
</template>
