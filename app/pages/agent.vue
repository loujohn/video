<script setup lang="ts">
import { Settings, PanelRight, Send, Loader2, AlertCircle } from 'lucide-vue-next'

definePageMeta({ layout: 'default' })

const chat = useAgentChat()
const inputText = ref('')
const showSettings = ref(false)
const showSidebar = ref(true)
const messagesContainer = ref<HTMLElement | null>(null)

const { $api } = useApi()
const project = ref<any>(null)

watch(() => chat.projectId.value, async (id) => {
  if (id) {
    try {
      project.value = await $api(`/api/projects/${id}`)
    }
    catch { project.value = null }
  }
  else {
    project.value = null
  }
})

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

watch(() => chat.messages.value.length, scrollToBottom)
watch(() => chat.streamingContent.value, scrollToBottom)

async function handleSend() {
  const text = inputText.value.trim()
  if (!text) return
  inputText.value = ''
  await chat.sendMessage(text)
}

function handleSuggest(text: string) {
  inputText.value = text
  handleSend()
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}
</script>

<template>
  <div class="flex h-[calc(100vh-64px)] bg-zinc-50">
    <!-- Chat area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Header -->
      <div class="h-[52px] border-b border-zinc-200 bg-white flex items-center justify-between px-4 shrink-0">
        <div class="flex items-center gap-3">
          <span class="text-sm font-semibold flex items-center gap-1.5">
            🤖 AI 创作助手
          </span>
          <AgentProjectSelector v-model="chat.projectId.value" />
        </div>
        <div class="flex items-center gap-2">
          <button
            class="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 transition-colors"
            title="侧边栏"
            @click="showSidebar = !showSidebar"
          >
            <PanelRight class="h-4 w-4" />
          </button>
          <button
            class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-zinc-200 hover:border-indigo-400 text-zinc-500 hover:text-indigo-600 transition-colors"
            @click="showSettings = true"
          >
            <Settings class="h-3.5 w-3.5" />
            设置
          </button>
        </div>
      </div>

      <!-- Messages -->
      <div ref="messagesContainer" class="flex-1 overflow-y-auto">
        <!-- Empty state -->
        <AgentEmptyState
          v-if="!chat.messages.value.length && !chat.isStreaming.value"
          @suggest="handleSuggest"
        />

        <!-- Messages -->
        <template v-else>
          <AgentChatMessage
            v-for="msg in chat.messages.value"
            :key="msg.id"
            :role="msg.role"
            :content="msg.content"
          />
          <!-- Streaming message -->
          <AgentChatMessage
            v-if="chat.isStreaming.value && chat.streamingContent.value"
            role="assistant"
            :content="chat.streamingContent.value"
            :is-streaming="true"
          />
          <!-- Loading indicator -->
          <div
            v-if="chat.isStreaming.value && !chat.streamingContent.value"
            class="px-6 py-4 bg-white border-y border-zinc-100"
          >
            <div class="max-w-[720px] mx-auto flex items-center gap-2">
              <Loader2 class="h-4 w-4 animate-spin text-indigo-500" />
              <span class="text-xs text-zinc-400">AI 正在思考...</span>
            </div>
          </div>
        </template>

        <!-- Error -->
        <div
          v-if="chat.error.value"
          class="px-6 py-4"
        >
          <div class="max-w-[720px] mx-auto flex items-center gap-2 text-rose-500 bg-rose-50 px-4 py-3 rounded-lg">
            <AlertCircle class="h-4 w-4 shrink-0" />
            <span class="text-xs">{{ chat.error.value }}</span>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="border-t border-zinc-200 bg-white px-4 py-3">
        <div class="max-w-[720px] mx-auto">
          <div class="flex items-end gap-2 border border-zinc-200 rounded-xl px-3 py-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all bg-white">
            <textarea
              v-model="inputText"
              placeholder="描述你的创意，或输入 /命令..."
              rows="1"
              class="flex-1 text-sm outline-none resize-none min-h-[24px] max-h-[120px] leading-relaxed"
              :disabled="chat.isStreaming.value"
              @keydown="handleKeydown"
            />
            <button
              class="h-8 w-8 rounded-lg bg-linear-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-center shrink-0 hover:opacity-90 disabled:opacity-40 transition-opacity"
              :disabled="!inputText.trim() || chat.isStreaming.value"
              @click="handleSend"
            >
              <Send class="h-3.5 w-3.5" />
            </button>
          </div>
          <div class="text-[10px] text-zinc-400 mt-1.5 pl-1">
            Enter 发送 · Shift+Enter 换行 · 输入 / 查看可用命令
          </div>
        </div>
      </div>
    </div>

    <!-- Context Sidebar -->
    <AgentContextSidebar
      v-if="showSidebar"
      :project="project"
    />

    <!-- Settings Dialog -->
    <AgentSettingsDialog
      v-if="showSettings"
      @close="showSettings = false"
    />
  </div>
</template>
