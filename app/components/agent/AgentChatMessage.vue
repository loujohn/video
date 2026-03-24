<script setup lang="ts">
import { Bot, User } from 'lucide-vue-next'
import { marked } from 'marked'
import type { ToolCallInfo } from '~/composables/useAgentChat'

interface Props {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  toolCalls?: ToolCallInfo[]
}

const props = defineProps<Props>()

marked.setOptions({
  breaks: true,
  gfm: true,
})

const renderedContent = computed(() => {
  if (props.role === 'user') return ''
  if (!props.content) return ''
  try {
    return marked.parse(props.content) as string
  }
  catch {
    return props.content
  }
})
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

      <!-- Tool calls -->
      <div v-if="toolCalls?.length" class="pl-8 mb-3 space-y-1.5">
        <AgentToolCall
          v-for="tc in toolCalls"
          :key="tc.id"
          :tool-call="tc"
        />
      </div>

      <!-- Content -->
      <div v-if="content" class="pl-8">
        <!-- User: plain text -->
        <div
          v-if="role === 'user'"
          class="text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap"
        >
          {{ content }}
        </div>
        <!-- Assistant: Markdown -->
        <div
          v-else
          class="prose prose-sm prose-zinc max-w-none [&_p]:leading-relaxed [&_li]:leading-relaxed [&_pre]:bg-zinc-900 [&_pre]:text-zinc-100 [&_code]:text-indigo-600 [&_code]:bg-indigo-50 [&_code]:px-1 [&_code]:rounded [&_pre_code]:text-zinc-100 [&_pre_code]:bg-transparent [&_pre_code]:px-0 [&_table]:text-xs [&_th]:bg-zinc-50"
          v-html="renderedContent"
        />
        <span
          v-if="isStreaming"
          class="inline-block w-1.5 h-4 bg-indigo-500 animate-pulse ml-0.5 align-text-bottom rounded-sm"
        />
      </div>
    </div>
  </div>
</template>
