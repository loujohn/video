<script setup lang="ts">
import { LogOut } from 'lucide-vue-next'

const { user, logout } = useAuth()
</script>

<template>
  <header class="h-14 border-b border-zinc-200 bg-white flex items-center justify-between px-6">
    <div>
      <h1 class="text-sm font-medium text-zinc-900">
        <slot name="title">Drama Studio</slot>
      </h1>
    </div>

    <div class="flex items-center gap-3">
      <span class="text-sm text-zinc-500">{{ user?.name }}</span>
      <button
        class="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        @click="logout"
      >
        <LogOut class="h-4 w-4" />
        退出
      </button>
    </div>
  </header>
</template>
