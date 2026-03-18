<script setup lang="ts">
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
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <Card class="w-full max-w-md">
      <template #title>
        <h2 class="text-2xl font-bold text-center">创建账户</h2>
      </template>
      <template #subtitle>
        <p class="text-center">开始你的短剧创作之旅</p>
      </template>
      <template #content>
        <form @submit.prevent="handleRegister" class="space-y-4">
          <div class="flex flex-col gap-2">
            <label for="name">名称</label>
            <InputText id="name" v-model="name" placeholder="你的名字" required class="w-full" />
          </div>

          <div class="flex flex-col gap-2">
            <label for="email">邮箱</label>
            <InputText id="email" v-model="email" type="email" placeholder="your@email.com" required class="w-full" />
          </div>

          <div class="flex flex-col gap-2">
            <label for="password">密码</label>
            <Password id="password" v-model="password" placeholder="至少 6 个字符" toggleMask class="w-full" inputClass="w-full" />
          </div>

          <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

          <Button type="submit" label="注册" :loading="loading" class="w-full" />
        </form>
      </template>
      <template #footer>
        <p class="text-center text-sm text-gray-500">
          已有账户？
          <NuxtLink to="/login" class="text-primary-500 hover:underline">登录</NuxtLink>
        </p>
      </template>
    </Card>
  </div>
</template>
