<script setup lang="ts">
defineProps<{
  open: boolean
  title: string
  description?: string
  confirmText?: string
  destructive?: boolean
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <Dialog :open="open" @update:open="(v: boolean) => { if (!v) emit('cancel') }">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription v-if="description">{{ description }}</DialogDescription>
      </DialogHeader>
      <DialogFooter class="gap-2">
        <Button variant="outline" @click="emit('cancel')">取消</Button>
        <Button
          :variant="destructive ? 'destructive' : 'default'"
          @click="emit('confirm')"
        >
          {{ confirmText || '确认' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
