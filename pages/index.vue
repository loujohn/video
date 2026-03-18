<script setup lang="ts">
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
          <template #content>
            <div class="text-center">
              <p class="text-3xl font-bold">{{ projects?.length || 0 }}</p>
              <p class="text-gray-500 text-sm">项目总数</p>
            </div>
          </template>
        </Card>
        <Card>
          <template #content>
            <div class="text-center">
              <p class="text-3xl font-bold">{{ teams?.length || 0 }}</p>
              <p class="text-gray-500 text-sm">团队数</p>
            </div>
          </template>
        </Card>
        <Card>
          <template #content>
            <div class="text-center">
              <p class="text-3xl font-bold">{{ user?.name }}</p>
              <p class="text-gray-500 text-sm">欢迎回来</p>
            </div>
          </template>
        </Card>
      </div>

      <Card>
        <template #title>
          <div class="flex items-center justify-between">
            <span>最近项目</span>
            <NuxtLink to="/projects">
              <Button label="查看全部" text size="small" />
            </NuxtLink>
          </div>
        </template>
        <template #content>
          <div v-if="projects?.length" class="space-y-3">
            <div
              v-for="project in projects.slice(0, 5)"
              :key="project.id"
              class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <div>
                <p class="font-medium">{{ project.title }}</p>
                <p class="text-sm text-gray-500">{{ (project.genre || []).join(' · ') }}</p>
              </div>
              <Tag :severity="project.status === 'completed' ? 'success' : 'warn'" :value="project.status" />
            </div>
          </div>
          <p v-else class="text-gray-400 text-center py-8">暂无项目，去创建第一个吧</p>
        </template>
      </Card>
    </div>
  </LayoutAppLayout>
</template>
