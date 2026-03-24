<script setup lang="ts">
import { Bot, Sparkles } from 'lucide-vue-next'

const emit = defineEmits<{
  suggest: [text: string]
}>()

const suggestions = [
  '创建一个武侠短剧',
  '都市甜宠10集',
  '悬疑推理类型',
  '穿越+复仇题材',
]
</script>

<template>
  <div class="flex flex-col items-center justify-center h-full gap-5 px-8">
    <div class="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
      <Bot class="h-8 w-8 text-indigo-600" />
    </div>
    <h2 class="text-lg font-semibold text-zinc-700">AI 创作助手</h2>
    <p class="text-sm text-zinc-400 text-center max-w-md leading-relaxed">
      告诉我你的创意灵感，我会帮你完成从剧本到成片的完整流程。<br>
      你也可以选择一个已有项目继续创作。
    </p>
    <div class="flex flex-wrap gap-2 justify-center mt-2">
      <button
        v-for="s in suggestions"
        :key="s"
        class="text-xs px-4 py-2 rounded-full border border-zinc-200 bg-white text-zinc-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
        @click="emit('suggest', s)"
      >
        <Sparkles class="inline h-3 w-3 mr-1" />
        {{ s }}
      </button>
    </div>
  </div>
</template>
