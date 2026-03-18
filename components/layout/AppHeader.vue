<script setup lang="ts">
import { LogOut, Bell } from 'lucide-vue-next'

const { user, logout } = useAuth()
</script>

<template>
  <header class="h-16 border-b border-zinc-200/80 bg-white/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
    <div>
      <h1 class="text-base font-semibold text-zinc-900">
        <slot name="title">Drama Studio</slot>
      </h1>
    </div>

    <div class="flex items-center gap-2">
      <button class="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 transition-colors relative">
        <Bell class="h-[18px] w-[18px]" />
        <span class="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500" />
      </button>

      <Separator orientation="vertical" class="h-6 mx-1" />

      <div class="flex items-center gap-3 pl-1">
        <div class="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-semibold">
          {{ user?.name?.charAt(0) || '?' }}
        </div>
        <div class="hidden sm:block">
          <p class="text-sm font-medium text-zinc-800 leading-none">{{ user?.name }}</p>
          <p class="text-xs text-zinc-400 mt-0.5">{{ user?.email }}</p>
        </div>
      </div>

      <button
        class="p-2 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors ml-1"
        @click="logout"
        title="退出登录"
      >
        <LogOut class="h-4 w-4" />
      </button>
    </div>
  </header>
</template>
