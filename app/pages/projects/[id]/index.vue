<script setup lang="ts">
import { Users, ListOrdered, MapPin, Pencil } from 'lucide-vue-next'
import type { Project, Character, Episode, Scene } from '~/core/types'

const route = useRoute()
const projectId = route.params.id as string
const { $api } = useApi()

const { data: project, status: projectStatus, error: projectError, refresh: refreshProject } = useAsyncData(`project-${projectId}`, () =>
  $api<Project>(`/api/projects/${projectId}`),
)

const showEdit = ref(false)

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

const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-zinc-100 text-zinc-600' },
  in_progress: { label: '进行中', color: 'bg-indigo-50 text-indigo-700' },
  review: { label: '审核中', color: 'bg-amber-50 text-amber-700' },
  completed: { label: '已完成', color: 'bg-emerald-50 text-emerald-700' },
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
            <Badge
              :class="statusMap[project.status]?.color"
              variant="secondary"
            >
              {{ statusMap[project.status]?.label || project.status }}
            </Badge>
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
