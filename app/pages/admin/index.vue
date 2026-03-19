<script setup lang="ts">
import { Search, Shield, Pencil, Ban, Trash2, KeyRound, Copy, Check, UserCircle } from 'lucide-vue-next'
import type { UserPublic } from '~/core/types'

useHead({ title: '用户管理 - Drama Studio' })

const { $api } = useApi()
const { user: currentUser } = useAuth()
const token = useCookie('token')

const searchQuery = ref('')
const roleFilter = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const perPage = 20

const {
  data: usersData,
  status: usersStatus,
  error: usersError,
  refresh,
} = useAsyncData(
  'admin-users',
  () => {
    const params = new URLSearchParams()
    if (searchQuery.value) params.set('q', searchQuery.value)
    if (roleFilter.value) params.set('role', roleFilter.value)
    if (statusFilter.value) params.set('is_active', statusFilter.value)
    params.set('page', String(currentPage.value))
    params.set('per_page', String(perPage))
    const headers: Record<string, string> = {}
    if (token.value) headers['Authorization'] = `Bearer ${token.value}`
    return $fetch<{
      success: boolean
      data: UserPublic[]
      pagination: { total: number; page: number; pageSize: number; totalPages: number }
    }>(`/api/admin/users?${params.toString()}`, { headers })
  },
  { watch: [searchQuery, roleFilter, statusFilter, currentPage] },
)

const users = computed(() => usersData.value?.data || [])
const pagination = computed(() => usersData.value?.pagination)

const showEdit = ref(false)
const editingUser = ref<UserPublic | null>(null)
const editForm = reactive({ name: '', role: 'user' as string })
const editLoading = ref(false)
const editError = ref('')

function openEdit(u: UserPublic) {
  editingUser.value = u
  editForm.name = u.name
  editForm.role = u.role
  editError.value = ''
  showEdit.value = true
}

async function submitEdit() {
  if (!editingUser.value) return
  editLoading.value = true
  editError.value = ''
  try {
    await $api(`/api/admin/users/${editingUser.value.id}`, {
      method: 'PUT',
      body: { name: editForm.name, role: editForm.role },
    })
    showEdit.value = false
    refresh()
  } catch (e: any) {
    editError.value = e.data?.statusMessage || '更新失败'
  } finally {
    editLoading.value = false
  }
}

const showConfirm = ref(false)
const confirmAction = ref<'toggle' | 'delete'>('toggle')
const confirmUser = ref<UserPublic | null>(null)
const confirmLoading = ref(false)

function openToggleActive(u: UserPublic) {
  confirmUser.value = u
  confirmAction.value = 'toggle'
  showConfirm.value = true
}

function openDelete(u: UserPublic) {
  confirmUser.value = u
  confirmAction.value = 'delete'
  showConfirm.value = true
}

async function executeConfirm() {
  if (!confirmUser.value) return
  confirmLoading.value = true
  try {
    if (confirmAction.value === 'toggle') {
      await $api(`/api/admin/users/${confirmUser.value.id}`, {
        method: 'PUT',
        body: { is_active: !confirmUser.value.is_active },
      })
    } else {
      await $api(`/api/admin/users/${confirmUser.value.id}`, { method: 'DELETE' })
    }
    showConfirm.value = false
    refresh()
  } catch (e: any) {
    alert(e.data?.statusMessage || '操作失败')
  } finally {
    confirmLoading.value = false
  }
}

const showResetResult = ref(false)
const tempPassword = ref('')
const resetLoading = ref(false)
const copied = ref(false)

async function resetPassword(u: UserPublic) {
  resetLoading.value = true
  try {
    const res = await $api<{ temporary_password: string }>(
      `/api/admin/users/${u.id}/reset-password`,
      { method: 'PUT' },
    )
    tempPassword.value = res.temporary_password
    showResetResult.value = true
  } catch (e: any) {
    alert(e.data?.statusMessage || '重置失败')
  } finally {
    resetLoading.value = false
  }
}

async function copyPassword() {
  await navigator.clipboard.writeText(tempPassword.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

function isSelf(u: UserPublic) {
  return u.id === currentUser.value?.id
}

const roleMap: Record<string, string> = { admin: '管理员', user: '普通用户' }

let searchTimer: ReturnType<typeof setTimeout>
function onSearch(val: string | number) {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    searchQuery.value = String(val)
    currentPage.value = 1
  }, 300)
}
</script>

<template>
  <LayoutAppLayout>
    <template #title>用户管理</template>

    <CommonPageLoading v-if="usersStatus === 'pending' && !usersData" />
    <CommonPageError v-else-if="usersError" :error="usersError" :retry-fn="refresh" />
    <div v-else class="max-w-5xl">
      <div class="flex flex-wrap items-center gap-3 mb-6">
        <div class="relative flex-1 min-w-[200px]">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            :model-value="searchQuery"
            @update:model-value="onSearch"
            placeholder="搜索用户名称或邮箱..."
            class="pl-9 h-10"
          />
        </div>
        <select
          v-model="roleFilter"
          class="h-10 rounded-md border border-input bg-background px-3 text-sm min-w-[120px]"
          @change="currentPage = 1"
        >
          <option value="">全部角色</option>
          <option value="admin">管理员</option>
          <option value="user">普通用户</option>
        </select>
        <select
          v-model="statusFilter"
          class="h-10 rounded-md border border-input bg-background px-3 text-sm min-w-[120px]"
          @change="currentPage = 1"
        >
          <option value="">全部状态</option>
          <option value="true">启用</option>
          <option value="false">禁用</option>
        </select>
      </div>

      <div class="bg-white rounded-xl border border-zinc-200/60 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-zinc-100 bg-zinc-50/50">
                <th class="text-left px-4 py-3 font-medium text-zinc-500">用户</th>
                <th class="text-left px-4 py-3 font-medium text-zinc-500">邮箱</th>
                <th class="text-left px-4 py-3 font-medium text-zinc-500">角色</th>
                <th class="text-left px-4 py-3 font-medium text-zinc-500">状态</th>
                <th class="text-left px-4 py-3 font-medium text-zinc-500">注册时间</th>
                <th class="text-right px-4 py-3 font-medium text-zinc-500">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in users" :key="u.id" class="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2.5">
                    <div class="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-xs font-semibold text-indigo-700">
                      {{ u.name?.charAt(0) || '?' }}
                    </div>
                    <span class="font-medium text-zinc-800">{{ u.name }}</span>
                    <Badge v-if="isSelf(u)" variant="outline" class="text-[10px]">我</Badge>
                  </div>
                </td>
                <td class="px-4 py-3 text-zinc-500">{{ u.email }}</td>
                <td class="px-4 py-3">
                  <Badge :variant="u.role === 'admin' ? 'default' : 'secondary'" class="text-[10px]">
                    <Shield v-if="u.role === 'admin'" class="h-3 w-3 mr-0.5" />
                    {{ roleMap[u.role] || u.role }}
                  </Badge>
                </td>
                <td class="px-4 py-3">
                  <Badge :class="u.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'" variant="outline" class="text-[10px]">
                    {{ u.is_active ? '启用' : '禁用' }}
                  </Badge>
                </td>
                <td class="px-4 py-3 text-zinc-400 text-xs">{{ new Date(u.created_at).toLocaleDateString('zh-CN') }}</td>
                <td class="px-4 py-3 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" class="h-7 px-2 text-xs" @click="openEdit(u)">
                      <Pencil class="h-3 w-3" />
                    </Button>
                    <Button
                      v-if="!isSelf(u)"
                      variant="ghost"
                      size="sm"
                      class="h-7 px-2 text-xs"
                      @click="openToggleActive(u)"
                    >
                      <Ban class="h-3 w-3" />
                    </Button>
                    <Button
                      v-if="!isSelf(u)"
                      variant="ghost"
                      size="sm"
                      class="h-7 px-2 text-xs"
                      @click="resetPassword(u)"
                      :disabled="resetLoading"
                    >
                      <KeyRound class="h-3 w-3" />
                    </Button>
                    <Button
                      v-if="!isSelf(u)"
                      variant="ghost"
                      size="sm"
                      class="h-7 px-2 text-xs text-red-500 hover:text-red-600"
                      @click="openDelete(u)"
                    >
                      <Trash2 class="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
              <tr v-if="!users.length">
                <td colspan="6" class="px-4 py-12 text-center text-zinc-400">
                  <UserCircle class="h-8 w-8 mx-auto mb-2 text-zinc-300" />
                  暂无用户数据
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="pagination && pagination.totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-zinc-100">
          <p class="text-xs text-zinc-400">
            共 {{ pagination.total }} 个用户，第 {{ pagination.page }}/{{ pagination.totalPages }} 页
          </p>
          <div class="flex gap-1">
            <Button variant="outline" size="sm" class="h-7 text-xs" :disabled="currentPage <= 1" @click="currentPage--">
              上一页
            </Button>
            <Button variant="outline" size="sm" class="h-7 text-xs" :disabled="currentPage >= pagination.totalPages" @click="currentPage++">
              下一页
            </Button>
          </div>
        </div>
      </div>
    </div>

    <Dialog :open="showEdit" @update:open="(v: boolean) => { if (!v) showEdit = false }">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>编辑用户</DialogTitle>
        </DialogHeader>
        <form @submit.prevent="submitEdit" class="space-y-4 mt-2">
          <div class="space-y-2">
            <Label>名称</Label>
            <Input v-model="editForm.name" required placeholder="用户名称" />
          </div>
          <div v-if="editingUser && !isSelf(editingUser)" class="space-y-2">
            <Label>角色</Label>
            <select v-model="editForm.role" class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          <div v-if="editError" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{{ editError }}</div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="showEdit = false">取消</Button>
            <Button type="submit" :disabled="editLoading">{{ editLoading ? '保存中...' : '保存' }}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog :open="showConfirm" @update:open="(v: boolean) => { if (!v) showConfirm = false }">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ confirmAction === 'delete' ? '确认删除' : (confirmUser?.is_active ? '确认禁用' : '确认启用') }}</DialogTitle>
        </DialogHeader>
        <p class="text-sm text-zinc-600 mt-2">
          <template v-if="confirmAction === 'delete'">
            确定要删除用户 <strong>{{ confirmUser?.name }}</strong>（{{ confirmUser?.email }}）吗？此操作不可撤销。
          </template>
          <template v-else>
            确定要{{ confirmUser?.is_active ? '禁用' : '启用' }}用户 <strong>{{ confirmUser?.name }}</strong>（{{ confirmUser?.email }}）吗？
            <span v-if="confirmUser?.is_active" class="block mt-1 text-red-500">禁用后该用户将无法登录。</span>
          </template>
        </p>
        <DialogFooter class="mt-4">
          <Button variant="outline" @click="showConfirm = false">取消</Button>
          <Button
            :class="confirmAction === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''"
            :disabled="confirmLoading"
            @click="executeConfirm"
          >
            {{ confirmLoading ? '处理中...' : '确认' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog :open="showResetResult" @update:open="(v: boolean) => { if (!v) showResetResult = false }">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>密码已重置</DialogTitle>
        </DialogHeader>
        <div class="mt-3 space-y-3">
          <p class="text-sm text-zinc-600">新的临时密码：</p>
          <div class="flex items-center gap-2">
            <code class="flex-1 bg-zinc-100 px-4 py-2.5 rounded-lg text-sm font-mono tracking-wider">{{ tempPassword }}</code>
            <Button variant="outline" size="sm" @click="copyPassword" class="shrink-0">
              <Copy v-if="!copied" class="h-4 w-4" />
              <Check v-else class="h-4 w-4 text-emerald-600" />
            </Button>
          </div>
          <p class="text-xs text-zinc-400">请将此密码告知用户，建议用户登录后修改密码。</p>
        </div>
        <DialogFooter class="mt-4">
          <Button @click="showResetResult = false">关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </LayoutAppLayout>
</template>
