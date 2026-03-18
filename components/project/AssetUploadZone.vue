<script setup lang="ts">
import { Upload } from 'lucide-vue-next'

const props = defineProps<{ projectId: string }>()
const emit = defineEmits<{ (e: 'uploaded', asset: any): void }>()

const token = useCookie('token')
const inputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const uploading = ref(false)
const uploadProgress = ref<Record<string, 'pending' | 'uploading' | 'done' | 'error'>>({})
const uploadError = ref('')

function triggerInput() {
  inputRef.value?.click()
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  isDragging.value = true
}

function onDragLeave(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  isDragging.value = false
}

async function onDrop(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  isDragging.value = false
  const files = Array.from(e.dataTransfer?.files ?? [])
  if (files.length) await uploadFiles(files)
}

async function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (files.length) await uploadFiles(files)
}

async function uploadFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('category', 'general')

  const res = await $fetch<{ success: boolean; data: any }>(
    `/api/projects/${props.projectId}/assets`,
    {
      method: 'POST',
      body: formData,
      headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
    },
  )
  return res.data
}

async function uploadFiles(files: File[]) {
  uploadError.value = ''
  uploading.value = true
  const progress: Record<string, 'pending' | 'uploading' | 'done' | 'error'> = {}
  files.forEach((f) => (progress[f.name] = 'pending'))
  uploadProgress.value = { ...progress }

  for (const file of files) {
    uploadProgress.value[file.name] = 'uploading'
    uploadProgress.value = { ...uploadProgress.value }
    try {
      const asset = await uploadFile(file)
      uploadProgress.value[file.name] = 'done'
      uploadProgress.value = { ...uploadProgress.value }
      emit('uploaded', asset)
    } catch (e: any) {
      uploadProgress.value[file.name] = 'error'
      uploadProgress.value = { ...uploadProgress.value }
      uploadError.value = e.data?.statusMessage || '上传失败'
    }
  }

  uploading.value = false
}
</script>

<template>
  <div
    class="rounded-xl border-2 border-dashed transition-colors cursor-pointer"
    :class="[
      isDragging
        ? 'border-indigo-500 bg-indigo-50/50'
        : 'border-zinc-300 hover:border-zinc-400 bg-zinc-50/50',
    ]"
    @click="triggerInput"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <input
      ref="inputRef"
      type="file"
      multiple
      class="hidden"
      accept="image/*,audio/*,video/*"
      @change="onFileSelect"
    />
    <div class="flex flex-col items-center justify-center py-10 px-6">
      <div
        class="h-12 w-12 rounded-xl flex items-center justify-center mb-3"
        :class="isDragging ? 'bg-indigo-100' : 'bg-zinc-100'"
      >
        <Upload class="h-6 w-6" :class="isDragging ? 'text-indigo-600' : 'text-zinc-500'" />
      </div>
      <p class="text-sm font-medium text-zinc-600">点击或拖拽上传</p>
      <p class="text-xs text-zinc-400 mt-1">支持图片、音频、视频</p>
    </div>
    <div v-if="Object.keys(uploadProgress).length" class="border-t border-zinc-200 px-4 py-3 space-y-2">
      <div
        v-for="(status, name) in uploadProgress"
        :key="name"
        class="flex items-center gap-2 text-xs"
      >
        <span class="truncate flex-1 text-zinc-600">{{ name }}</span>
        <span
          :class="{
            'text-zinc-400': status === 'pending',
            'text-indigo-600': status === 'uploading',
            'text-emerald-600': status === 'done',
            'text-red-600': status === 'error',
          }"
        >
          {{ status === 'pending' ? '等待' : status === 'uploading' ? '上传中' : status === 'done' ? '完成' : '失败' }}
        </span>
      </div>
    </div>
    <div
      v-if="uploadError"
      class="text-sm text-red-600 bg-red-50 border-t border-red-100 rounded-b-xl px-4 py-2"
    >
      {{ uploadError }}
    </div>
  </div>
</template>
