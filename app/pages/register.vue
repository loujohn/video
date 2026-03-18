<script setup lang="ts">
import { Film } from 'lucide-vue-next'

definePageMeta({ layout: false })

const { register } = useAuth()
const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleRegister() {
  error.value = ''
  loading.value = true
  try {
    await register(name.value, email.value, password.value)
    navigateTo('/')
  } catch (e: any) {
    error.value = e.data?.statusMessage || '注册失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex">
    <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 relative overflow-hidden">
      <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6bTAtMzB2Mkgydi0yaDM0ek0yIDBoNjB2NjBIMlYweiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
      <div class="relative z-10 flex flex-col justify-center px-16 text-white">
        <div class="flex items-center gap-3 mb-8">
          <div class="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Film class="h-6 w-6" />
          </div>
          <span class="text-2xl font-bold">Drama Studio</span>
        </div>
        <h2 class="text-4xl font-bold leading-tight mb-4">
          开启你的<br />短剧创作之旅
        </h2>
        <p class="text-lg text-white/70 max-w-md">
          加入 Drama Studio，让创意落地，让故事发光。
        </p>
      </div>
    </div>

    <div class="flex-1 flex items-center justify-center p-8 bg-white">
      <div class="w-full max-w-sm">
        <div class="lg:hidden flex items-center gap-2 mb-8">
          <div class="h-9 w-9 rounded-lg bg-violet-600 flex items-center justify-center">
            <Film class="h-5 w-5 text-white" />
          </div>
          <span class="text-xl font-bold">Drama Studio</span>
        </div>

        <div class="mb-8">
          <h1 class="text-2xl font-bold tracking-tight text-zinc-900">创建账户</h1>
          <p class="text-sm text-zinc-500 mt-1">开始你的短剧创作之旅</p>
        </div>

        <form @submit.prevent="handleRegister" class="space-y-5">
          <div class="space-y-2">
            <Label for="name" class="text-sm font-medium text-zinc-700">名称</Label>
            <Input id="name" v-model="name" placeholder="你的名字" required class="h-11" />
          </div>

          <div class="space-y-2">
            <Label for="email" class="text-sm font-medium text-zinc-700">邮箱</Label>
            <Input id="email" v-model="email" type="email" placeholder="your@email.com" required class="h-11" />
          </div>

          <div class="space-y-2">
            <Label for="password" class="text-sm font-medium text-zinc-700">密码</Label>
            <Input id="password" v-model="password" type="password" placeholder="至少 6 个字符" required class="h-11" />
          </div>

          <div v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {{ error }}
          </div>

          <Button
            type="submit"
            class="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white font-medium shadow-sm shadow-violet-200"
            :disabled="loading"
          >
            {{ loading ? '注册中...' : '注册' }}
          </Button>
        </form>

        <p class="text-center text-sm text-zinc-500 mt-8">
          已有账户？
          <NuxtLink to="/login" class="text-violet-600 font-medium hover:text-violet-700">登录</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
