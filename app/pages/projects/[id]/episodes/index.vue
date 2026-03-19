<script setup lang="ts">
import { Plus, ListOrdered, Pencil, Trash2, FileText, Film } from 'lucide-vue-next'

const route = useRoute()
const projectId = route.params.id as string
const { $api } = useApi()

const { data: project, status: projectStatus, error: projectError, refresh: refreshProject } = useAsyncData(`project-${projectId}`, () => $api<any>(`/api/projects/${projectId}`))
const { data: episodes, refresh } = useAsyncData(`eps-${projectId}`, () =>
  $api<any[]>(`/api/projects/${projectId}/episodes`),
)

const showForm = ref(false)
const editing = ref<any>(null)
const form = reactive({
  episode_number: 1,
  title: '',
  synopsis: '',
  hook_type: '',
  is_key_episode: false,
  is_paywall: false,
  act: 1,
  rhythm_phase: '起势',
  status: 'planned',
})
const loading = ref(false)
const error = ref('')

function openCreate() {
  editing.value = null
  const nextNum = (episodes.value?.length || 0) + 1
  Object.assign(form, { episode_number: nextNum, title: '', synopsis: '', hook_type: '', is_key_episode: false, is_paywall: false, act: 1, rhythm_phase: '起势', status: 'planned' })
  error.value = ''
  showForm.value = true
}

function openEdit(ep: any) {
  editing.value = ep
  Object.assign(form, {
    episode_number: ep.episode_number,
    title: ep.title || '',
    synopsis: ep.synopsis || '',
    hook_type: ep.hook_type || '',
    is_key_episode: ep.is_key_episode,
    is_paywall: ep.is_paywall,
    act: ep.act || 1,
    rhythm_phase: ep.rhythm_phase || '起势',
    status: ep.status,
  })
  error.value = ''
  showForm.value = true
}

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    if (editing.value) {
      await $api(`/api/projects/${projectId}/episodes/${editing.value.episode_number}`, { method: 'PUT', body: form })
    } else {
      await $api(`/api/projects/${projectId}/episodes`, { method: 'POST', body: form })
    }
    showForm.value = false
    refresh()
  } catch (e: any) {
    error.value = e.data?.statusMessage || '操作失败'
  } finally {
    loading.value = false
  }
}

const deleteTarget = ref<any>(null)
const showDeleteConfirm = ref(false)

function openDeleteEpisode(ep: any) {
  deleteTarget.value = ep
  showDeleteConfirm.value = true
}

async function handleDeleteEpisode() {
  if (!deleteTarget.value) return
  try {
    await $api(`/api/projects/${projectId}/episodes/${deleteTarget.value.episode_number}`, { method: 'DELETE' })
    showDeleteConfirm.value = false
    deleteTarget.value = null
    refresh()
  } catch (e: any) {
    error.value = e.data?.statusMessage || '删除失败'
  }
}

const statusMap: Record<string, { label: string; color: string }> = {
  planned: { label: '待编写', color: 'bg-zinc-100 text-zinc-600' },
  writing: { label: '编写中', color: 'bg-indigo-50 text-indigo-700' },
  written: { label: '已完成', color: 'bg-emerald-50 text-emerald-700' },
}

const hookTypes = ['悬念钩', '反转钩', '情绪钩', '信息钩', '危机钩']
const rhythmPhases = ['起势', '攀升', '风暴', '决战']
</script>

<template>
  <LayoutAppLayout>
    <template #title>{{ project?.title || '项目' }} — 分集</template>

    <CommonPageLoading v-if="projectStatus === 'pending'" />
    <CommonPageError v-else-if="projectError" :error="projectError" :retry-fn="refreshProject" />
    <div v-else class="max-w-5xl">
      <ProjectSubNav :project-id="projectId" />

      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-bold text-zinc-900">分集目录</h2>
        <Button @click="openCreate" size="sm" class="gap-2">
          <Plus class="h-3.5 w-3.5" />
          新建分集
        </Button>
      </div>

      <div v-if="episodes?.length" class="bg-white rounded-xl border border-zinc-200/60 shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-zinc-50/80 border-b border-zinc-100">
              <th class="text-left px-4 py-3 font-medium text-zinc-500 w-16">集号</th>
              <th class="text-left px-4 py-3 font-medium text-zinc-500">标题</th>
              <th class="text-left px-4 py-3 font-medium text-zinc-500 w-24">钩子</th>
              <th class="text-left px-4 py-3 font-medium text-zinc-500 w-20">节奏</th>
              <th class="text-center px-4 py-3 font-medium text-zinc-500 w-16">标记</th>
              <th class="text-left px-4 py-3 font-medium text-zinc-500 w-20">状态</th>
              <th class="w-12" />
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-50">
            <tr
              v-for="ep in episodes"
              :key="ep.id"
              class="hover:bg-zinc-50/50 transition-colors"
            >
              <td class="px-4 py-3 font-mono text-zinc-400">{{ String(ep.episode_number).padStart(2, '0') }}</td>
              <td class="px-4 py-3 font-medium text-zinc-900">{{ ep.title || '—' }}</td>
              <td class="px-4 py-3 text-xs text-zinc-500">{{ ep.hook_type || '—' }}</td>
              <td class="px-4 py-3 text-xs text-zinc-500">{{ ep.rhythm_phase || '—' }}</td>
              <td class="px-4 py-3 text-center">
                <span v-if="ep.is_key_episode" title="重点集">🔥</span>
                <span v-if="ep.is_paywall" title="付费卡点">💰</span>
              </td>
              <td class="px-4 py-3">
                <Badge :class="statusMap[ep.status]?.color" variant="secondary" class="text-[10px]">
                  {{ statusMap[ep.status]?.label || ep.status }}
                </Badge>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-1">
                  <NuxtLink
                    :to="`/projects/${projectId}/episodes/${ep.episode_number}/script`"
                    class="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                    title="编辑剧本"
                  >
                    <FileText class="h-3 w-3" />
                  </NuxtLink>
                  <NuxtLink
                    :to="`/projects/${projectId}/episodes/${ep.episode_number}/storyboards`"
                    class="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-indigo-600"
                    title="分镜管理"
                  >
                    <Film class="h-3 w-3" />
                  </NuxtLink>
                  <Button variant="ghost" size="sm" class="h-7 w-7 p-0 text-zinc-400" @click="openEdit(ep)">
                    <Pencil class="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" class="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" @click="openDeleteEpisode(ep)">
                    <Trash2 class="h-3 w-3" />
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <CommonEmptyState v-else :icon="ListOrdered" title="暂无分集" description="添加分集开始规划剧集">
        <Button @click="openCreate" size="sm" class="gap-2"><Plus class="h-3.5 w-3.5" /> 新建分集</Button>
      </CommonEmptyState>
    </div>

    <Sheet :open="showForm" @update:open="(v: boolean) => { if (!v) showForm = false }">
      <SheetContent class="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{{ editing ? `编辑第${form.episode_number}集` : '新建分集' }}</SheetTitle>
        </SheetHeader>
        <form @submit.prevent="handleSubmit" class="space-y-4 mt-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>集号 *</Label>
              <Input v-model.number="form.episode_number" type="number" min="1" required :disabled="!!editing" />
            </div>
            <div class="space-y-2">
              <Label>所属幕</Label>
              <select v-model.number="form.act" class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option :value="1">第一幕</option><option :value="2">第二幕</option><option :value="3">第三幕</option>
              </select>
            </div>
          </div>
          <div class="space-y-2"><Label>标题</Label><Input v-model="form.title" placeholder="集标题" /></div>
          <div class="space-y-2"><Label>概要</Label><Textarea v-model="form.synopsis" rows="2" placeholder="一句话概要" /></div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>钩子类型</Label>
              <select v-model="form.hook_type" class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">无</option>
                <option v-for="h in hookTypes" :key="h" :value="h">{{ h }}</option>
              </select>
            </div>
            <div class="space-y-2">
              <Label>节奏段落</Label>
              <select v-model="form.rhythm_phase" class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option v-for="r in rhythmPhases" :key="r" :value="r">{{ r }}</option>
              </select>
            </div>
          </div>
          <div class="flex gap-6">
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="form.is_key_episode" class="rounded border-zinc-300" />
              🔥 重点集
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="form.is_paywall" class="rounded border-zinc-300" />
              💰 付费卡点
            </label>
          </div>
          <div v-if="editing" class="space-y-2">
            <Label>状态</Label>
            <select v-model="form.status" class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="planned">待编写</option><option value="writing">编写中</option><option value="written">已完成</option>
            </select>
          </div>
          <div v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{{ error }}</div>
          <div class="flex gap-2 pt-2">
            <Button type="button" variant="outline" @click="showForm = false" class="flex-1">取消</Button>
            <Button type="submit" :disabled="loading" class="flex-1">{{ loading ? '保存中...' : '保存' }}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>

    <CommonConfirmDialog
      :open="showDeleteConfirm"
      title="确认删除"
      description="确定要删除该分集吗？"
      confirm-text="删除"
      destructive
      @confirm="handleDeleteEpisode"
      @cancel="showDeleteConfirm = false; deleteTarget = null"
    />
  </LayoutAppLayout>
</template>
