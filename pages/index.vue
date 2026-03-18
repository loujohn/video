<script setup lang="ts">
import { Film, Users, Sparkles } from 'lucide-vue-next'

const { $api } = useApi()
const { user } = useAuth()

const { data: projects } = useAsyncData('dashboard-projects', () =>
  $api<any[]>('/api/projects'),
)

const { data: teams } = useAsyncData('dashboard-teams', () =>
  $api<any[]>('/api/teams'),
)
</script>

<template>
  <LayoutAppLayout>
    <template #title>仪表盘</template>

    <div class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent class="pt-6">
            <div class="flex items-center gap-4">
              <div class="h-10 w-10 rounded-lg bg-zinc-900 flex items-center justify-center">
                <Film class="h-5 w-5 text-white" />
              </div>
              <div>
                <p class="text-2xl font-semibold">{{ projects?.length || 0 }}</p>
                <p class="text-sm text-zinc-500">项目总数</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="pt-6">
            <div class="flex items-center gap-4">
              <div class="h-10 w-10 rounded-lg bg-zinc-900 flex items-center justify-center">
                <Users class="h-5 w-5 text-white" />
              </div>
              <div>
                <p class="text-2xl font-semibold">{{ teams?.length || 0 }}</p>
                <p class="text-sm text-zinc-500">团队数</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="pt-6">
            <div class="flex items-center gap-4">
              <div class="h-10 w-10 rounded-lg bg-zinc-900 flex items-center justify-center">
                <Sparkles class="h-5 w-5 text-white" />
              </div>
              <div>
                <p class="text-2xl font-semibold">{{ user?.name }}</p>
                <p class="text-sm text-zinc-500">欢迎回来</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <CardTitle class="text-base">最近项目</CardTitle>
            <NuxtLink to="/projects">
              <Button variant="ghost" size="sm">查看全部</Button>
            </NuxtLink>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="projects?.length" class="space-y-2">
            <div
              v-for="project in projects.slice(0, 5)"
              :key="project.id"
              class="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              <div>
                <p class="text-sm font-medium">{{ project.title }}</p>
                <p class="text-xs text-zinc-500">{{ (project.genre || []).join(' · ') }}</p>
              </div>
              <Badge :variant="project.status === 'completed' ? 'default' : 'secondary'">
                {{ project.status }}
              </Badge>
            </div>
          </div>
          <p v-else class="text-zinc-400 text-center py-8 text-sm">暂无项目，去创建第一个吧</p>
        </CardContent>
      </Card>
    </div>
  </LayoutAppLayout>
</template>
