<script setup lang="ts">
import { Film } from 'lucide-vue-next'

definePageMeta({ layout: false })

const { login } = useAuth()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await login(email.value, password.value)
    navigateTo('/')
  } catch (e: any) {
    error.value = e.data?.statusMessage || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex">
    <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 relative overflow-hidden">
      <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6bTAtMzB2Mkgydi0yaDM0ek0yIDBoNjB2NjBIMlYweiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
      <div class="relative z-10 flex flex-col justify-center px-16 text-white">
        <div class="flex items-center gap-3 mb-8">
          <div class="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Film class="h-6 w-6" />
          </div>
          <span class="text-2xl font-bold">Drama Studio</span>
        </div>
        <h2 class="text-4xl font-bold leading-tight mb-4">
          短剧创作<br />全流程管理平台
        </h2>
        <p class="text-lg text-white/70 max-w-md">
          从剧本到成片，从角色到场景，一站式管理你的短剧创作全过程。
        </p>
        <div class="mt-12 flex gap-8 text-sm text-white/50">
          <div>
            <p class="text-3xl font-bold text-white/90">14+</p>
            <p>资源类型管理</p>
          </div>
          <div>
            <p class="text-3xl font-bold text-white/90">AI</p>
            <p>智能创作辅助</p>
          </div>
          <div>
            <p class="text-3xl font-bold text-white/90">团队</p>
            <p>多人协作</p>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 flex items-center justify-center p-8 bg-white">
      <div class="w-full max-w-sm">
        <div class="lg:hidden flex items-center gap-2 mb-8">
          <div class="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Film class="h-5 w-5 text-white" />
          </div>
          <span class="text-xl font-bold">Drama Studio</span>
        </div>

        <div class="mb-8">
          <h1 class="text-2xl font-bold tracking-tight text-zinc-900">欢迎回来</h1>
          <p class="text-sm text-zinc-500 mt-1">登录到你的账户继续创作</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <div class="space-y-2">
            <Label for="email" class="text-sm font-medium text-zinc-700">邮箱</Label>
            <Input
              id="email"
              v-model="email"
              type="email"
              placeholder="your@email.com"
              required
              class="h-11"
            />
          </div>

          <div class="space-y-2">
            <Label for="password" class="text-sm font-medium text-zinc-700">密码</Label>
            <Input
              id="password"
              v-model="password"
              type="password"
              placeholder="输入密码"
              required
              class="h-11"
            />
          </div>

          <div v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {{ error }}
          </div>

          <Button
            type="submit"
            class="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm shadow-indigo-200"
            :disabled="loading"
          >
            {{ loading ? '登录中...' : '登录' }}
          </Button>
        </form>

        <p class="text-center text-sm text-zinc-500 mt-8">
          还没有账户？
          <NuxtLink to="/register" class="text-indigo-600 font-medium hover:text-indigo-700">注册</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
