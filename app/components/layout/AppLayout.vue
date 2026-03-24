<script setup lang="ts">
interface Props {
  flush?: boolean
}

withDefaults(defineProps<Props>(), {
  flush: false,
})
</script>

<template>
  <div class="flex h-screen bg-zinc-50/50">
    <LayoutAppSidebar />
    <div class="flex-1 flex flex-col overflow-hidden">
      <LayoutAppHeader>
        <template #title>
          <slot name="title" />
        </template>
      </LayoutAppHeader>
      <main :class="['flex-1 overflow-auto', flush ? '' : 'p-8']">
        <slot />
      </main>
    </div>
  </div>
</template>
