<script setup lang="ts">
import {
  Film, Users, TrendingUp, ArrowRight, Clapperboard,
  BookOpen, UserCircle, MapPin, Image as ImageIcon, Video,
  BarChart3,
} from 'lucide-vue-next'
import type { Project, Team } from '~/core/types'

interface DashboardStats {
  projects: { total: number; by_status: Record<string, number> }
  episodes: { total: number }
  characters: { total: number }
  scenes: { total: number }
  storyboards: { total: number; with_image_prompt: number; with_video_prompt: number }
  recent_activity: Array<{
    project_id: string
    title: string
    status: string
    genre: string[]
    updated_at: string
    episode_count: number
    character_count: number
    storyboard_count: number
    progress?: import('~/core/types/project').ProjectProgress
  }>
}

const { $api } = useApi()
const { user } = useAuth()

useHead({ title: '仪表盘 - Drama Studio' })

const { data: stats, status: statsStatus, error: statsError, refresh: refreshStats } = useAsyncData('dashboard-stats', () =>
  $api<DashboardStats>('/api/dashboard/stats'),
)

const { data: teams } = useAsyncData('dashboard-teams', () =>
  $api<Team[]>('/api/teams'),
)

const statusMap = PROJECT_STATUS_MAP

const promptCoverage = computed(() => {
  const sb = stats.value?.storyboards
  if (!sb || sb.total === 0) return { image: 0, video: 0 }
  return {
    image: Math.round((sb.with_image_prompt / sb.total) * 100),
    video: Math.round((sb.with_video_prompt / sb.total) * 100),
  }
})
</script>

<template>
  <LayoutAppLayout>
    <template #title>仪表盘</template>

    <CommonPageLoading v-if="statsStatus === 'pending'" />
    <CommonPageError v-else-if="statsError" :error="statsError" :retry-fn="refreshStats" />
    <div v-else class="max-w-5xl space-y-8">
      <div>
        <h2 class="text-2xl font-bold text-zinc-900">
          你好，{{ user?.name }} 👋
        </h2>
        <p class="text-sm text-zinc-500 mt-1">这是你的创作概览</p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="bg-white rounded-2xl border border-zinc-200/60 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-3">
            <div class="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-200">
              <Clapperboard class="h-4.5 w-4.5 text-white" />
            </div>
          </div>
          <p class="text-2xl font-bold text-zinc-900">{{ stats?.projects?.total || 0 }}</p>
          <p class="text-xs text-zinc-500 mt-0.5">项目</p>
        </div>

        <div class="bg-white rounded-2xl border border-zinc-200/60 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-3">
            <div class="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm shadow-violet-200">
              <BookOpen class="h-4.5 w-4.5 text-white" />
            </div>
          </div>
          <p class="text-2xl font-bold text-zinc-900">{{ stats?.episodes?.total || 0 }}</p>
          <p class="text-xs text-zinc-500 mt-0.5">分集</p>
        </div>

        <div class="bg-white rounded-2xl border border-zinc-200/60 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-3">
            <div class="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-sm shadow-rose-200">
              <UserCircle class="h-4.5 w-4.5 text-white" />
            </div>
          </div>
          <p class="text-2xl font-bold text-zinc-900">{{ stats?.characters?.total || 0 }}</p>
          <p class="text-xs text-zinc-500 mt-0.5">角色</p>
        </div>

        <div class="bg-white rounded-2xl border border-zinc-200/60 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-3">
            <div class="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm shadow-amber-200">
              <Film class="h-4.5 w-4.5 text-white" />
            </div>
          </div>
          <p class="text-2xl font-bold text-zinc-900">{{ stats?.storyboards?.total || 0 }}</p>
          <p class="text-xs text-zinc-500 mt-0.5">分镜</p>
        </div>
      </div>

      <!-- Prompt Coverage + Quick Actions -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <!-- Prompt Coverage -->
        <div class="bg-white rounded-2xl border border-zinc-200/60 p-6 shadow-sm">
          <div class="flex items-center gap-2 mb-4">
            <BarChart3 class="h-4 w-4 text-indigo-500" />
            <h3 class="text-sm font-semibold text-zinc-700">AI 提示词覆盖率</h3>
          </div>
          <div v-if="stats?.storyboards?.total" class="space-y-3">
            <div>
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="flex items-center gap-1 text-zinc-500"><ImageIcon class="h-3 w-3" /> 图片提示词</span>
                <span class="font-medium text-zinc-700">{{ stats.storyboards.with_image_prompt }}/{{ stats.storyboards.total }}</span>
              </div>
              <div class="w-full bg-zinc-100 rounded-full h-2">
                <div class="bg-indigo-500 h-2 rounded-full transition-all duration-500" :style="{ width: `${promptCoverage.image}%` }" />
              </div>
            </div>
            <div>
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="flex items-center gap-1 text-zinc-500"><Video class="h-3 w-3" /> 视频提示词</span>
                <span class="font-medium text-zinc-700">{{ stats.storyboards.with_video_prompt }}/{{ stats.storyboards.total }}</span>
              </div>
              <div class="w-full bg-zinc-100 rounded-full h-2">
                <div class="bg-rose-500 h-2 rounded-full transition-all duration-500" :style="{ width: `${promptCoverage.video}%` }" />
              </div>
            </div>
          </div>
          <div v-else class="text-center py-4">
            <p class="text-xs text-zinc-400">暂无分镜数据</p>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 rounded-2xl p-6 shadow-lg shadow-indigo-200/50 text-white">
          <div class="flex items-center justify-between mb-4">
            <div class="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <TrendingUp class="h-4.5 w-4.5" />
            </div>
          </div>
          <p class="text-lg font-semibold">快速开始</p>
          <p class="text-sm text-white/70 mt-1">创建新项目或继续创作</p>
          <div class="flex gap-2 mt-4">
            <NuxtLink to="/projects" class="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
              <Clapperboard class="h-3.5 w-3.5" /> 项目列表
            </NuxtLink>
            <NuxtLink to="/teams" class="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              <Users class="h-3.5 w-3.5" /> 团队管理
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Project Status Distribution -->
      <div v-if="stats?.projects?.total" class="bg-white rounded-2xl border border-zinc-200/60 p-6 shadow-sm">
        <h3 class="text-sm font-semibold text-zinc-700 mb-4">项目状态分布</h3>
        <div class="flex gap-3 flex-wrap">
          <div
            v-for="(count, status) in stats.projects.by_status"
            :key="status"
            class="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-100"
          >
            <span
              :class="[
                'text-xs font-medium px-2 py-0.5 rounded-full',
                statusMap[status as keyof typeof statusMap]?.color || 'bg-zinc-100 text-zinc-600',
              ]"
            >
              {{ statusMap[status as keyof typeof statusMap]?.label || status }}
            </span>
            <span class="text-sm font-bold text-zinc-700">{{ count }}</span>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="bg-white rounded-2xl border border-zinc-200/60 shadow-sm">
        <div class="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div>
            <h3 class="text-base font-semibold text-zinc-900">最近项目动态</h3>
            <p class="text-xs text-zinc-400 mt-0.5">你参与的项目进度</p>
          </div>
          <NuxtLink to="/projects">
            <Button variant="ghost" size="sm" class="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
              查看全部
              <ArrowRight class="h-3.5 w-3.5 ml-1" />
            </Button>
          </NuxtLink>
        </div>

        <div v-if="stats?.recent_activity?.length" class="divide-y divide-zinc-50">
          <NuxtLink
            v-for="item in stats.recent_activity"
            :key="item.project_id"
            :to="`/projects/${item.project_id}`"
            class="block px-6 py-4 hover:bg-zinc-50/50 transition-colors cursor-pointer"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
                  <Clapperboard class="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p class="text-sm font-medium text-zinc-900">{{ item.title }}</p>
                  <p class="text-xs text-zinc-400 mt-0.5">{{ (item.genre || []).join(' · ') || '未设置类型' }}</p>
                </div>
              </div>
              <span
                :class="[
                  'text-xs font-medium px-2.5 py-1 rounded-full',
                  statusMap[item.status as keyof typeof statusMap]?.color || 'bg-zinc-100 text-zinc-600',
                ]"
              >
                {{ statusMap[item.status as keyof typeof statusMap]?.label || item.status }}
              </span>
            </div>
            <div v-if="item.progress" class="mt-3 ml-14">
              <ProjectProgressPanel :progress="item.progress" />
            </div>
          </NuxtLink>
        </div>
        <div v-else class="px-6 py-16 text-center">
          <div class="h-12 w-12 rounded-xl bg-zinc-100 flex items-center justify-center mx-auto mb-3">
            <Film class="h-6 w-6 text-zinc-400" />
          </div>
          <p class="text-sm text-zinc-500">暂无项目</p>
          <p class="text-xs text-zinc-400 mt-1">点击上方"项目列表"创建第一个项目</p>
        </div>
      </div>
    </div>
  </LayoutAppLayout>
</template>
