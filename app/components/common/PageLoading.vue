<script setup lang="ts">
defineProps<{
  text?: string
}>()
</script>

<template>
  <div class="flex items-center justify-center py-24">
    <div class="text-center">
      <div class="h-8 w-8 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin mx-auto mb-3" />
      <p class="text-sm text-zinc-500">{{ text || '加载中...' }}</p>
    </div>
  </div>
</template>
