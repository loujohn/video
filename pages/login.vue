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
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <Card class="w-full max-w-md">
      <template #title>
        <h2 class="text-2xl font-bold text-center">Drama Studio</h2>
      </template>
      <template #subtitle>
        <p class="text-center">登录到你的账户</p>
      </template>
      <template #content>
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div class="flex flex-col gap-2">
            <label for="email">邮箱</label>
            <InputText id="email" v-model="email" type="email" placeholder="your@email.com" required class="w-full" />
          </div>

          <div class="flex flex-col gap-2">
            <label for="password">密码</label>
            <Password id="password" v-model="password" placeholder="输入密码" :feedback="false" toggleMask class="w-full" inputClass="w-full" />
          </div>

          <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

          <Button type="submit" label="登录" :loading="loading" class="w-full" />
        </form>
      </template>
      <template #footer>
        <p class="text-center text-sm text-gray-500">
          还没有账户？
          <NuxtLink to="/register" class="text-primary-500 hover:underline">注册</NuxtLink>
        </p>
      </template>
    </Card>
  </div>
</template>
