<script setup lang="ts">
import { Plus, User, Pencil, Trash2 } from 'lucide-vue-next'

const route = useRoute()
const projectId = route.params.id as string
const { $api } = useApi()

const { data: project } = useAsyncData(`project-${projectId}`, () =>
  $api<any>(`/api/projects/${projectId}`),
)

const { data: characters, refresh } = useAsyncData(`chars-${projectId}`, () =>
  $api<any[]>(`/api/projects/${projectId}/characters`),
)

const editing = ref<any>(null)
const showForm = ref(false)
const confirmDelete = ref<any>(null)
const form = reactive({
  name: '',
  age: null as number | null,
  appearance: '',
  personality_tags: '',
  public_identity: '',
  real_identity: '',
  motivation: '',
  catchphrase: '',
})
const loading = ref(false)
const error = ref('')

function openCreate() {
  editing.value = null
  Object.assign(form, { name: '', age: null, appearance: '', personality_tags: '', public_identity: '', real_identity: '', motivation: '', catchphrase: '' })
  error.value = ''
  showForm.value = true
}

function openEdit(c: any) {
  editing.value = c
  Object.assign(form, {
    name: c.name,
    age: c.age,
    appearance: c.appearance || '',
    personality_tags: (c.personality_tags || []).join(', '),
    public_identity: c.public_identity || '',
    real_identity: c.real_identity || '',
    motivation: c.motivation || '',
    catchphrase: c.catchphrase || '',
  })
  error.value = ''
  showForm.value = true
}

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    const tags = form.personality_tags ? form.personality_tags.split(/[,，、]/).map(s => s.trim()).filter(Boolean) : []
    const body = { ...form, personality_tags: tags, age: form.age || undefined }
    if (editing.value) {
      await $api(`/api/projects/${projectId}/characters/${editing.value.id}`, { method: 'PUT', body })
    } else {
      await $api(`/api/projects/${projectId}/characters`, { method: 'POST', body })
    }
    showForm.value = false
    refresh()
  } catch (e: any) {
    error.value = e.data?.statusMessage || '操作失败'
  } finally {
    loading.value = false
  }
}

async function handleDelete() {
  if (!confirmDelete.value) return
  try {
    await $api(`/api/projects/${projectId}/characters/${confirmDelete.value.id}`, { method: 'DELETE' })
    confirmDelete.value = null
    refresh()
  } catch (e: any) {
    error.value = e.data?.statusMessage || '删除失败'
  }
}
</script>

<template>
  <LayoutAppLayout>
    <template #title>{{ project?.title || '项目' }} — 角色</template>

    <div class="max-w-5xl">
      <ProjectSubNav :project-id="projectId" />

      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-bold text-zinc-900">角色管理</h2>
        <Button @click="openCreate" size="sm" class="gap-2">
          <Plus class="h-3.5 w-3.5" />
          新建角色
        </Button>
      </div>

      <div v-if="characters?.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="c in characters"
          :key="c.id"
          class="bg-white rounded-xl border border-zinc-200/60 p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div class="flex items-start gap-3">
            <div class="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center shrink-0">
              <User class="h-5 w-5 text-indigo-600" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-semibold text-zinc-900 truncate">{{ c.name }}</h3>
                <Badge v-if="!c.is_active" variant="secondary" class="bg-zinc-100 text-zinc-400 text-[10px]">已禁用</Badge>
              </div>
              <p class="text-xs text-zinc-500 mt-0.5">{{ c.public_identity || '未设置身份' }}</p>
              <div v-if="c.personality_tags?.length" class="flex flex-wrap gap-1 mt-2">
                <span
                  v-for="tag in c.personality_tags.slice(0, 4)"
                  :key="tag"
                  class="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
          <div class="flex gap-1 mt-3 pt-3 border-t border-zinc-100">
            <Button variant="ghost" size="sm" class="h-7 text-xs text-zinc-500 hover:text-indigo-600" @click="openEdit(c)">
              <Pencil class="h-3 w-3 mr-1" /> 编辑
            </Button>
            <Button variant="ghost" size="sm" class="h-7 text-xs text-zinc-500 hover:text-red-600" @click="confirmDelete = c">
              <Trash2 class="h-3 w-3 mr-1" /> 删除
            </Button>
          </div>
        </div>
      </div>

      <CommonEmptyState v-else :icon="User" title="暂无角色" description="添加第一个角色开始创作">
        <Button @click="openCreate" size="sm" class="gap-2">
          <Plus class="h-3.5 w-3.5" /> 新建角色
        </Button>
      </CommonEmptyState>
    </div>

    <Sheet :open="showForm" @update:open="(v: boolean) => { if (!v) showForm = false }">
      <SheetContent class="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{{ editing ? '编辑角色' : '新建角色' }}</SheetTitle>
        </SheetHeader>
        <form @submit.prevent="handleSubmit" class="space-y-4 mt-4">
          <div class="space-y-2">
            <Label>角色名 *</Label>
            <Input v-model="form.name" required placeholder="输入角色名" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>年龄</Label>
              <Input v-model.number="form.age" type="number" placeholder="如 25" />
            </div>
            <div class="space-y-2">
              <Label>公开身份</Label>
              <Input v-model="form.public_identity" placeholder="如 甜品店老板" />
            </div>
          </div>
          <div class="space-y-2">
            <Label>真实身份</Label>
            <Input v-model="form.real_identity" placeholder="如 集团继承人" />
          </div>
          <div class="space-y-2">
            <Label>性格标签</Label>
            <Input v-model="form.personality_tags" placeholder="倔强, 善良, 聪明（逗号分隔）" />
          </div>
          <div class="space-y-2">
            <Label>外貌描述</Label>
            <Textarea v-model="form.appearance" placeholder="描述角色外貌" rows="2" />
          </div>
          <div class="space-y-2">
            <Label>核心动机</Label>
            <Textarea v-model="form.motivation" placeholder="角色的核心驱动力" rows="2" />
          </div>
          <div class="space-y-2">
            <Label>口头禅</Label>
            <Input v-model="form.catchphrase" placeholder="角色的口头禅" />
          </div>

          <div v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {{ error }}
          </div>

          <div class="flex gap-2 pt-2">
            <Button type="button" variant="outline" @click="showForm = false" class="flex-1">取消</Button>
            <Button type="submit" :disabled="loading || !form.name" class="flex-1">
              {{ loading ? '保存中...' : (editing ? '保存修改' : '创建角色') }}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>

    <CommonConfirmDialog
      :open="!!confirmDelete"
      title="删除角色"
      :description="`确定删除角色「${confirmDelete?.name}」吗？此操作不可撤销。`"
      confirm-text="删除"
      destructive
      @confirm="handleDelete"
      @cancel="confirmDelete = null"
    />
  </LayoutAppLayout>
</template>
