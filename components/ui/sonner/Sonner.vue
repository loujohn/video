<script lang="ts" setup>
import { Toaster as Sonner, type ToasterProps } from 'vue-sonner'

const props = withDefaults(defineProps<ToasterProps>(), {
  theme: 'light',
  position: 'bottom-right',
  richColors: true,
  duration: 3000,
})
</script>

<template>
  <Sonner v-bind="props" />
</template>
