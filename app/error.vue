<script setup lang="ts">
import { Home, ArrowLeft } from 'lucide-vue-next'

interface ErrorProps {
  error: {
    statusCode: number
    statusMessage?: string
    message?: string
  }
}

const props = defineProps<ErrorProps>()

const titles: Record<number, string> = {
  404: '页面不存在',
  403: '无权访问',
  500: '服务器错误',
}

const title = computed(() =>
  titles[props.error.statusCode] ?? '出错了'
)

const displayMessage = computed(() =>
  props.error.statusMessage ?? props.error.message ?? ''
)

const router = useRouter()

function goHome() {
  clearError({ redirect: '/' })
}

function goBack() {
  clearError()
  router.back()
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
    <div class="text-center max-w-md">
      <p class="text-8xl font-bold text-zinc-200 dark:text-zinc-800 tracking-tighter">
        {{ error.statusCode }}
      </p>
      <h1 class="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        {{ title }}
      </h1>
      <p v-if="displayMessage" class="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        {{ displayMessage }}
      </p>
      <div class="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 px-4 py-2.5 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          @click="goHome"
        >
          <Home class="size-4" />
          返回首页
        </button>
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-4 py-2.5 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          @click="goBack"
        >
          <ArrowLeft class="size-4" />
          返回上页
        </button>
      </div>
    </div>
  </div>
</template>
