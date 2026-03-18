<script setup lang="ts">
const collapsed = ref(false)
const route = useRoute()

const navItems = [
  { label: '仪表盘', icon: 'pi pi-home', to: '/' },
  { label: '项目', icon: 'pi pi-video', to: '/projects' },
  { label: '团队', icon: 'pi pi-users', to: '/teams' },
]
</script>

<template>
  <aside
    :class="[
      'h-screen bg-gray-900 text-white transition-all duration-300 flex flex-col',
      collapsed ? 'w-16' : 'w-60',
    ]"
  >
    <div class="flex items-center justify-between p-4 border-b border-gray-700">
      <span v-if="!collapsed" class="text-lg font-bold">Drama Studio</span>
      <Button
        :icon="collapsed ? 'pi pi-chevron-right' : 'pi pi-chevron-left'"
        text
        severity="secondary"
        size="small"
        class="!text-white"
        @click="collapsed = !collapsed"
      />
    </div>

    <nav class="flex-1 p-2 space-y-1">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :class="[
          'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
          route.path === item.to || route.path.startsWith(item.to + '/')
            ? 'bg-gray-700 text-white'
            : 'text-gray-400 hover:text-white hover:bg-gray-800',
        ]"
      >
        <i :class="[item.icon, 'text-sm']" />
        <span v-if="!collapsed">{{ item.label }}</span>
      </NuxtLink>
    </nav>
  </aside>
</template>
