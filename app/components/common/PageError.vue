<script setup lang="ts">
import { AlertCircle, RefreshCcw } from 'lucide-vue-next'

defineProps<{
  error: Error | null
  retryFn?: () => void
}>()
</script>

<template>
  <div class="flex items-center justify-center py-16">
    <div class="text-center max-w-sm">
      <AlertCircle class="h-8 w-8 text-red-400 mx-auto mb-3" />
      <h3 class="text-sm font-medium text-zinc-900 mb-1">加载失败</h3>
      <p class="text-xs text-zinc-500 mb-4">{{ error?.message || '请稍后再试' }}</p>
      <button
        v-if="retryFn"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
        @click="retryFn"
      >
        <RefreshCcw class="h-3 w-3" />
        重试
      </button>
    </div>
  </div>
</template>
