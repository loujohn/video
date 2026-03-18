<script setup lang="ts">
import { Toaster } from 'vue-sonner'
</script>

<template>
  <NuxtPage />
  <ClientOnly>
    <Toaster position="bottom-right" :rich-colors="true" :duration="3000" />
  </ClientOnly>
</template>
