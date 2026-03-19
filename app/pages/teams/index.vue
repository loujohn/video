<script setup lang="ts">
import { Plus, Users, UserPlus, Pencil } from 'lucide-vue-next'

const { $api } = useApi()

const { data: teams, status: teamsStatus, error: teamsError, refresh } = useAsyncData('my-teams', () =>
  $api<any[]>('/api/teams'),
)

const showCreate = ref(false)
const createForm = reactive({ name: '', description: '' })
const createLoading = ref(false)
const createError = ref('')
const expandedTeam = ref<string | null>(null)
const members = ref<Record<string, any[]>>({})

const showAddMember = ref(false)
const addMemberTeamId = ref('')
const memberForm = reactive({ email: '', role: 'editor' })
const memberLoading = ref(false)
const memberError = ref('')

async function createTeam() {
  createError.value = ''
  createLoading.value = true
  try {
    await $api('/api/teams', { method: 'POST', body: createForm })
    showCreate.value = false
    Object.assign(createForm, { name: '', description: '' })
    refresh()
  } catch (e: any) {
    createError.value = e.data?.statusMessage || '创建失败'
  } finally {
    createLoading.value = false
  }
}

async function toggleTeam(teamId: string) {
  if (expandedTeam.value === teamId) {
    expandedTeam.value = null
    return
  }
  expandedTeam.value = teamId
  if (!members.value[teamId]) {
    const res = await $api<any[]>(`/api/teams/${teamId}/members`)
    members.value[teamId] = res as any
  }
}

function openAddMember(teamId: string) {
  addMemberTeamId.value = teamId
  Object.assign(memberForm, { email: '', role: 'editor' })
  memberError.value = ''
  showAddMember.value = true
}

async function addMember() {
  memberError.value = ''
  memberLoading.value = true
  try {
    await $api(`/api/teams/${addMemberTeamId.value}/members`, { method: 'POST', body: memberForm })
    showAddMember.value = false
    const res = await $api<any[]>(`/api/teams/${addMemberTeamId.value}/members`)
    members.value[addMemberTeamId.value] = res as any
  } catch (e: any) {
    memberError.value = e.data?.statusMessage || '添加失败'
  } finally {
    memberLoading.value = false
  }
}

const showEditTeam = ref(false)
const editingTeam = ref<any>(null)
const editForm = reactive({ name: '', description: '' })
const editLoading = ref(false)
const editError = ref('')

function openEditTeam(team: any) {
  editingTeam.value = team
  Object.assign(editForm, { name: team.name || '', description: team.description || '' })
  editError.value = ''
  showEditTeam.value = true
}

async function submitEditTeam() {
  if (!editingTeam.value) return
  editError.value = ''
  editLoading.value = true
  try {
    await $api(`/api/teams/${editingTeam.value.id}`, { method: 'PUT', body: editForm })
    showEditTeam.value = false
    editingTeam.value = null
    refresh()
  } catch (e: any) {
    editError.value = e.data?.statusMessage || '更新失败'
  } finally {
    editLoading.value = false
  }
}

const roleMap: Record<string, string> = { owner: '所有者', editor: '编辑者', viewer: '查看者' }
</script>

<template>
  <LayoutAppLayout>
    <template #title>团队</template>

    <CommonPageLoading v-if="teamsStatus === 'pending'" />
    <CommonPageError v-else-if="teamsError" :error="teamsError" :retry-fn="refresh" />
    <div v-else class="max-w-3xl">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-bold text-zinc-900">我的团队</h2>
          <p class="text-sm text-zinc-500 mt-0.5">管理团队和成员</p>
        </div>
        <Button @click="showCreate = true" class="gap-2">
          <Plus class="h-4 w-4" /> 新建团队
        </Button>
      </div>

      <div v-if="teams?.length" class="space-y-4">
        <div v-for="team in teams" :key="team.id" class="bg-white rounded-xl border border-zinc-200/60 shadow-sm overflow-hidden">
          <div class="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-zinc-50/50 transition-colors" @click="toggleTeam(team.id)">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
                <Users class="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 class="text-sm font-semibold text-zinc-900">{{ team.name }}</h3>
                <p v-if="team.description" class="text-xs text-zinc-400">{{ team.description }}</p>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <Button variant="ghost" size="sm" class="text-xs text-zinc-400" @click.stop="openEditTeam(team)">
                <Pencil class="h-3.5 w-3.5 mr-1" /> 编辑
              </Button>
              <Button variant="ghost" size="sm" class="text-xs text-zinc-400" @click.stop="openAddMember(team.id)">
                <UserPlus class="h-3.5 w-3.5 mr-1" /> 邀请
              </Button>
            </div>
          </div>

          <div v-if="expandedTeam === team.id && members[team.id]" class="border-t border-zinc-100 px-5 py-3">
            <div v-for="m in members[team.id]" :key="m.id" class="flex items-center justify-between py-2">
              <div class="flex items-center gap-2">
                <div class="h-7 w-7 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-medium text-zinc-600">
                  {{ m.user_name?.charAt(0) || '?' }}
                </div>
                <span class="text-sm text-zinc-800">{{ m.user_name || m.user_email }}</span>
              </div>
              <Badge variant="secondary" class="text-[10px]">{{ roleMap[m.role] || m.role }}</Badge>
            </div>
          </div>
        </div>
      </div>

      <CommonEmptyState v-else :icon="Users" title="暂无团队" description="创建一个团队开始协作">
        <Button @click="showCreate = true" size="sm" class="gap-2"><Plus class="h-3.5 w-3.5" /> 新建团队</Button>
      </CommonEmptyState>
    </div>

    <Dialog :open="showCreate" @update:open="(v: boolean) => { if (!v) showCreate = false }">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新建团队</DialogTitle>
        </DialogHeader>
        <form @submit.prevent="createTeam" class="space-y-4 mt-2">
          <div class="space-y-2"><Label>团队名称 *</Label><Input v-model="createForm.name" required placeholder="输入团队名称" /></div>
          <div class="space-y-2"><Label>描述</Label><Textarea v-model="createForm.description" rows="2" placeholder="团队描述（可选）" /></div>
          <div v-if="createError" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{{ createError }}</div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="showCreate = false">取消</Button>
            <Button type="submit" :disabled="createLoading || !createForm.name">{{ createLoading ? '创建中...' : '创建' }}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog :open="showEditTeam" @update:open="(v: boolean) => { if (!v) showEditTeam = false }">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>编辑团队</DialogTitle>
        </DialogHeader>
        <form @submit.prevent="submitEditTeam" class="space-y-4 mt-2">
          <div class="space-y-2"><Label>团队名称 *</Label><Input v-model="editForm.name" required placeholder="输入团队名称" /></div>
          <div class="space-y-2"><Label>描述</Label><Textarea v-model="editForm.description" rows="2" placeholder="团队描述（可选）" /></div>
          <div v-if="editError" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{{ editError }}</div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="showEditTeam = false">取消</Button>
            <Button type="submit" :disabled="editLoading || !editForm.name">{{ editLoading ? '保存中...' : '保存' }}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog :open="showAddMember" @update:open="(v: boolean) => { if (!v) showAddMember = false }">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>邀请成员</DialogTitle>
        </DialogHeader>
        <form @submit.prevent="addMember" class="space-y-4 mt-2">
          <div class="space-y-2"><Label>邮箱 *</Label><Input v-model="memberForm.email" type="email" required placeholder="成员邮箱" /></div>
          <div class="space-y-2">
            <Label>角色</Label>
            <select v-model="memberForm.role" class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="editor">编辑者</option><option value="viewer">查看者</option>
            </select>
          </div>
          <div v-if="memberError" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{{ memberError }}</div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="showAddMember = false">取消</Button>
            <Button type="submit" :disabled="memberLoading || !memberForm.email">{{ memberLoading ? '添加中...' : '添加' }}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </LayoutAppLayout>
</template>
