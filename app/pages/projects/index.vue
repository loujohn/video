<script setup lang="ts">
import { Plus, Clapperboard } from 'lucide-vue-next'
import type { Team } from '~/core/types'
import type { ProjectWithProgress } from '~/core/types/project'

const { $api } = useApi()
const showCreate = ref(false)

useHead({ title: '项目列表 - Drama Studio' })

const { data: projects, refresh, error: projectsError, status: projectsStatus } = useAsyncData('projects', () =>
  $api<ProjectWithProgress[]>('/api/projects?include=progress'),
)

const { data: teams } = useAsyncData('my-teams', () =>
  $api<Team[]>('/api/teams'),
)

function handleCreated() {
  showCreate.value = false
  refresh()
}
</script>

<template>
  <LayoutAppLayout>
    <template #title>项目</template>

    <div class="max-w-5xl">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-bold text-zinc-900">我的项目</h2>
          <p class="text-sm text-zinc-500 mt-0.5">管理你的短剧创作项目</p>
        </div>
        <Button @click="showCreate = true" class="gap-2">
          <Plus class="h-4 w-4" />
          新建项目
        </Button>
      </div>

      <div v-if="projectsStatus === 'pending'" class="py-16 text-center">
        <p class="text-sm text-zinc-400">加载中...</p>
      </div>
      <div v-else-if="projectsError" class="text-red-500 text-sm p-4 bg-red-50 rounded-lg">
        加载失败: {{ projectsError.message }}
      </div>
      <div v-else-if="projects?.length" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ProjectCard
          v-for="p in projects"
          :key="p.id"
          :project="p"
        />
      </div>
      <CommonEmptyState
        v-else
        :icon="Clapperboard"
        title="暂无项目"
        description="创建你的第一个短剧项目开始创作"
      >
        <Button @click="showCreate = true" size="sm" class="gap-2">
          <Plus class="h-3.5 w-3.5" />
          新建项目
        </Button>
      </CommonEmptyState>
    </div>

    <ProjectCreateProjectDialog
      :open="showCreate"
      :teams="teams || []"
      @created="handleCreated"
      @close="showCreate = false"
    />
  </LayoutAppLayout>
</template>
