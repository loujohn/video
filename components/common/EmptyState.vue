<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  icon?: Component
  title: string
  description?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <div v-if="icon" class="h-12 w-12 rounded-xl bg-zinc-100 flex items-center justify-center mb-3">
      <component :is="icon" class="h-6 w-6 text-zinc-400" />
    </div>
    <p class="text-sm font-medium text-zinc-600">{{ title }}</p>
    <p v-if="description" class="text-xs text-zinc-400 mt-1 max-w-xs">{{ description }}</p>
    <div class="mt-4">
      <slot />
    </div>
  </div>
</template>
