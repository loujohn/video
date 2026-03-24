<script setup lang="ts">
import { X, Loader2 } from 'lucide-vue-next'

const emit = defineEmits<{
  close: []
}>()

const { $api } = useApi()
const loading = ref(true)
const saving = ref(false)
const error = ref('')

const form = reactive({
  provider: 'openai' as string,
  model: 'gpt-4o',
  api_key: '',
  base_url: '',
  temperature: 0.7,
  max_tokens: 4096,
})

const hasExistingKey = ref(false)
const maskedKey = ref('')

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'custom', label: '自定义（OpenAI 兼容）' },
]

const MODEL_OPTIONS: Record<string, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1', 'o1-mini'],
  anthropic: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
  custom: [],
}

onMounted(async () => {
  try {
    const data = await $api<any>('/api/agent/settings')
    form.provider = data.provider
    form.model = data.model
    form.base_url = data.base_url || ''
    form.temperature = data.temperature
    form.max_tokens = data.max_tokens
    hasExistingKey.value = data.has_api_key
    maskedKey.value = data.masked_api_key || ''
  }
  catch (err: any) {
    error.value = err?.data?.message || '加载设置失败'
  }
  finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  error.value = ''
  try {
    await $api('/api/agent/settings', {
      method: 'PUT',
      body: {
        provider: form.provider,
        model: form.model,
        ...(form.api_key ? { api_key: form.api_key } : {}),
        base_url: form.provider === 'custom' ? form.base_url : undefined,
        temperature: form.temperature,
        max_tokens: form.max_tokens,
      },
    })
    emit('close')
  }
  catch (err: any) {
    error.value = err?.data?.message || '保存失败'
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30" @click.self="emit('close')">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
      <div class="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
        <h3 class="text-sm font-semibold">AI 设置</h3>
        <button class="p-1 rounded-md hover:bg-zinc-100" @click="emit('close')">
          <X class="h-4 w-4 text-zinc-400" />
        </button>
      </div>

      <div v-if="loading" class="p-8 flex items-center justify-center">
        <Loader2 class="h-5 w-5 animate-spin text-zinc-400" />
      </div>

      <form v-else class="p-5 space-y-4" @submit.prevent="save">
        <div v-if="error" class="text-xs text-rose-500 bg-rose-50 px-3 py-2 rounded-lg">{{ error }}</div>

        <!-- Provider -->
        <div>
          <label class="text-xs font-medium text-zinc-600 block mb-1">AI 服务商</label>
          <select v-model="form.provider" class="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:border-indigo-500 outline-none">
            <option v-for="p in PROVIDERS" :key="p.value" :value="p.value">{{ p.label }}</option>
          </select>
        </div>

        <!-- Model -->
        <div>
          <label class="text-xs font-medium text-zinc-600 block mb-1">模型</label>
          <select
            v-if="MODEL_OPTIONS[form.provider]?.length"
            v-model="form.model"
            class="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:border-indigo-500 outline-none"
          >
            <option v-for="m in MODEL_OPTIONS[form.provider]" :key="m" :value="m">{{ m }}</option>
          </select>
          <input
            v-else
            v-model="form.model"
            type="text"
            placeholder="模型名称"
            class="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:border-indigo-500 outline-none"
          >
        </div>

        <!-- API Key -->
        <div>
          <label class="text-xs font-medium text-zinc-600 block mb-1">
            API Key
            <span v-if="hasExistingKey" class="text-zinc-400 ml-1">(当前: {{ maskedKey }})</span>
          </label>
          <input
            v-model="form.api_key"
            type="password"
            :placeholder="hasExistingKey ? '留空保持不变' : '输入 API Key'"
            class="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:border-indigo-500 outline-none font-mono"
          >
        </div>

        <!-- Base URL (custom only) -->
        <div v-if="form.provider === 'custom'">
          <label class="text-xs font-medium text-zinc-600 block mb-1">API Base URL</label>
          <input
            v-model="form.base_url"
            type="url"
            placeholder="https://api.example.com/v1"
            class="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:border-indigo-500 outline-none"
          >
        </div>

        <!-- Temperature -->
        <div>
          <label class="text-xs font-medium text-zinc-600 block mb-1">Temperature: {{ form.temperature }}</label>
          <input
            v-model.number="form.temperature"
            type="range"
            min="0"
            max="2"
            step="0.1"
            class="w-full accent-indigo-500"
          >
        </div>

        <!-- Max Tokens -->
        <div>
          <label class="text-xs font-medium text-zinc-600 block mb-1">Max Tokens</label>
          <input
            v-model.number="form.max_tokens"
            type="number"
            min="256"
            max="128000"
            class="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:border-indigo-500 outline-none"
          >
        </div>

        <button
          type="submit"
          :disabled="saving"
          class="w-full py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
          {{ saving ? '保存中...' : '保存设置' }}
        </button>
      </form>
    </div>
  </div>
</template>
