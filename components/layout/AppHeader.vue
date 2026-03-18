<script setup lang="ts">
const { user, logout } = useAuth()
</script>

<template>
  <header class="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
    <div>
      <h1 class="text-lg font-semibold text-gray-800">
        <slot name="title">Drama Studio</slot>
      </h1>
    </div>

    <div class="flex items-center gap-4">
      <span class="text-sm text-gray-600">{{ user?.name }}</span>
      <Button label="退出" text severity="secondary" size="small" @click="logout" />
    </div>
  </header>
</template>
