<script setup lang="ts">
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
  <div class="min-h-screen flex items-center justify-center bg-zinc-50">
    <div class="w-full max-w-sm mx-auto">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-semibold tracking-tight">Drama Studio</h1>
        <p class="text-sm text-zinc-500 mt-2">登录到你的账户</p>
      </div>

      <Card>
        <CardContent class="pt-6">
          <form @submit.prevent="handleLogin" class="space-y-4">
            <div class="space-y-2">
              <Label for="email">邮箱</Label>
              <Input id="email" v-model="email" type="email" placeholder="your@email.com" required />
            </div>

            <div class="space-y-2">
              <Label for="password">密码</Label>
              <Input id="password" v-model="password" type="password" placeholder="输入密码" required />
            </div>

            <div v-if="error" class="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {{ error }}
            </div>

            <Button type="submit" class="w-full" :disabled="loading">
              {{ loading ? '登录中...' : '登录' }}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p class="text-center text-sm text-zinc-500 mt-6">
        还没有账户？
        <NuxtLink to="/register" class="text-zinc-900 font-medium hover:underline">注册</NuxtLink>
      </p>
    </div>
  </div>
</template>
