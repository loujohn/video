<script setup lang="ts">
import { Bot, User } from 'lucide-vue-next'

interface Props {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

defineProps<Props>()
</script>

<template>
  <div
    :class="[
      'px-6 py-4',
      role === 'assistant' ? 'bg-white border-y border-zinc-100' : '',
    ]"
  >
    <div class="max-w-[720px] mx-auto">
      <div class="flex items-center gap-2 mb-2">
        <div
          :class="[
            'h-6 w-6 rounded-md flex items-center justify-center shrink-0',
            role === 'assistant'
              ? 'bg-gradient-to-br from-indigo-600 to-violet-600'
              : 'bg-emerald-500',
          ]"
        >
          <Bot v-if="role === 'assistant'" class="h-3.5 w-3.5 text-white" />
          <User v-else class="h-3.5 w-3.5 text-white" />
        </div>
        <span class="text-xs font-semibold text-zinc-600">
          {{ role === 'assistant' ? 'AI 创作助手' : '你' }}
        </span>
      </div>
      <div class="pl-8 text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap">
        {{ content }}
        <span
          v-if="isStreaming"
          class="inline-block w-1.5 h-4 bg-indigo-500 animate-pulse ml-0.5 align-text-bottom rounded-sm"
        />
      </div>
    </div>
  </div>
</template>
