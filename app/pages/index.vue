<script setup lang="ts">
import { Film, Users, TrendingUp, ArrowRight, Clapperboard } from 'lucide-vue-next'
import type { Project, Team } from '~/core/types'

const { $api } = useApi()
const { user } = useAuth()

const { data: projects, status: projectsStatus, error: projectsError, refresh: refreshProjects } = useAsyncData('dashboard-projects', () =>
  $api<Project[]>('/api/projects'),
)

const { data: teams } = useAsyncData('dashboard-teams', () =>
  $api<Team[]>('/api/teams'),
)

const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-zinc-100 text-zinc-600' },
  in_progress: { label: '进行中', color: 'bg-indigo-50 text-indigo-700' },
  review: { label: '审核中', color: 'bg-amber-50 text-amber-700' },
  completed: { label: '已完成', color: 'bg-emerald-50 text-emerald-700' },
}
</script>

<template>
  <LayoutAppLayout>
    <template #title>仪表盘</template>

    <CommonPageLoading v-if="projectsStatus === 'pending'" />
    <CommonPageError v-else-if="projectsError" :error="projectsError" :retry-fn="refreshProjects" />
    <div v-else class="max-w-5xl space-y-8">
      <div>
        <h2 class="text-2xl font-bold text-zinc-900">
          你好，{{ user?.name }} 👋
        </h2>
        <p class="text-sm text-zinc-500 mt-1">这是你的创作概览</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div class="bg-white rounded-2xl border border-zinc-200/60 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-4">
            <div class="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-200">
              <Clapperboard class="h-5 w-5 text-white" />
            </div>
            <TrendingUp class="h-4 w-4 text-emerald-500" />
          </div>
          <p class="text-3xl font-bold text-zinc-900">{{ projects?.length || 0 }}</p>
          <p class="text-sm text-zinc-500 mt-1">项目总数</p>
        </div>

        <div class="bg-white rounded-2xl border border-zinc-200/60 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-4">
            <div class="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm shadow-violet-200">
              <Users class="h-5 w-5 text-white" />
            </div>
            <TrendingUp class="h-4 w-4 text-emerald-500" />
          </div>
          <p class="text-3xl font-bold text-zinc-900">{{ teams?.length || 0 }}</p>
          <p class="text-sm text-zinc-500 mt-1">团队数</p>
        </div>

        <div class="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 rounded-2xl p-6 shadow-lg shadow-indigo-200/50 text-white">
          <div class="flex items-center justify-between mb-4">
            <div class="h-11 w-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Film class="h-5 w-5" />
            </div>
          </div>
          <p class="text-lg font-semibold">快速开始</p>
          <p class="text-sm text-white/70 mt-1">创建新项目开始创作</p>
          <NuxtLink to="/projects" class="inline-flex items-center gap-1 text-sm font-medium mt-3 text-white/90 hover:text-white transition-colors">
            开始创作
            <ArrowRight class="h-3.5 w-3.5" />
          </NuxtLink>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-zinc-200/60 shadow-sm">
        <div class="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div>
            <h3 class="text-base font-semibold text-zinc-900">最近项目</h3>
            <p class="text-xs text-zinc-400 mt-0.5">你参与的项目动态</p>
          </div>
          <NuxtLink to="/projects">
            <Button variant="ghost" size="sm" class="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
              查看全部
              <ArrowRight class="h-3.5 w-3.5 ml-1" />
            </Button>
          </NuxtLink>
        </div>

        <div v-if="projects?.length" class="divide-y divide-zinc-50">
          <div
            v-for="project in projects.slice(0, 5)"
            :key="project.id"
            class="flex items-center justify-between px-6 py-4 hover:bg-zinc-50/50 transition-colors cursor-pointer"
          >
            <div class="flex items-center gap-4">
              <div class="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
                <Clapperboard class="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p class="text-sm font-medium text-zinc-900">{{ project.title }}</p>
                <p class="text-xs text-zinc-400 mt-0.5">{{ (project.genre || []).join(' · ') || '未设置类型' }}</p>
              </div>
            </div>
            <span
              :class="[
                'text-xs font-medium px-2.5 py-1 rounded-full',
                statusMap[project.status]?.color || 'bg-zinc-100 text-zinc-600',
              ]"
            >
              {{ statusMap[project.status]?.label || project.status }}
            </span>
          </div>
        </div>
        <div v-else class="px-6 py-16 text-center">
          <div class="h-12 w-12 rounded-xl bg-zinc-100 flex items-center justify-center mx-auto mb-3">
            <Film class="h-6 w-6 text-zinc-400" />
          </div>
          <p class="text-sm text-zinc-500">暂无项目</p>
          <p class="text-xs text-zinc-400 mt-1">点击上方"开始创作"创建第一个项目</p>
        </div>
      </div>
    </div>
  </LayoutAppLayout>
</template>
