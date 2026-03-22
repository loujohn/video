<script setup lang="ts">
import { Plus, User, Pencil, Trash2, Link, ArrowRight, ExternalLink } from 'lucide-vue-next'
import type { Project, Character, CharacterLook, Asset } from '~/core/types'
import type { ThumbnailItem } from '~/components/project/EntityThumbnailRow.vue'

const route = useRoute()
const projectId = route.params.id as string
const { $api } = useApi()

const { data: project, status: projectStatus, error: projectError, refresh: refreshProject } = useAsyncData(`project-${projectId}`, () =>
  $api<Project>(`/api/projects/${projectId}`),
)

const { data: characters, refresh } = useAsyncData(`chars-${projectId}`, () =>
  $api<Character[]>(`/api/projects/${projectId}/characters`),
)

const { data: relations, refresh: refreshRelations } = useAsyncData(
  `relations-${projectId}`,
  () => $api<any[]>(`/api/projects/${projectId}/character-relations`),
)

useHead({ title: computed(() => project.value ? `${project.value.title} - 角色` : '角色管理') })

const looksMap = ref<Record<string, CharacterLook[]>>({})
const lookCovers = ref<Record<string, string | null>>({})

async function loadAllLooks() {
  if (!characters.value) return
  for (const c of characters.value) {
    try {
      const looks = await $api<CharacterLook[]>(`/api/projects/${projectId}/characters/${c.id}/looks`)
      looksMap.value[c.id] = looks
      for (const look of looks) {
        try {
          const assets = await $api<Asset[]>(
            `/api/projects/${projectId}/assets?linked_entity_type=character_look&linked_entity_id=${look.id}&type=image`,
          )
          const active = assets.filter(a => a.is_active)
          const cover = active.find(a => (a.metadata as any)?.is_cover) || active[0]
          lookCovers.value[look.id] = cover ? `/uploads/${cover.file_path}` : null
        } catch {
          lookCovers.value[look.id] = null
        }
      }
    } catch {}
  }
}

watch(characters, loadAllLooks, { immediate: true })

function getLookThumbnails(characterId: string): ThumbnailItem[] {
  const looks = looksMap.value[characterId] || []
  return looks.map(l => ({
    id: l.id,
    name: l.name,
    coverUrl: lookCovers.value[l.id] ?? null,
  }))
}

function getUnconfirmedIds(characterId: string): string[] {
  const looks = looksMap.value[characterId] || []
  return looks.filter(l => {
    const url = lookCovers.value[l.id]
    return url != null
  }).filter(l => {
    return false
  }).map(l => l.id)
}

function goToDetail(characterId: string) {
  navigateTo(`/projects/${projectId}/characters/${characterId}`)
}

const showRelationForm = ref(false)
const relationForm = reactive({
  from_character_id: '',
  to_character_id: '',
  relation_type: '',
  description: '',
})
const relationLoading = ref(false)
const relationError = ref('')

function getCharacterName(id: string) {
  return characters.value?.find((c) => c.id === id)?.name ?? '—'
}

function toRelationPayload(r: any) {
  return {
    from_character_id: r.from_character_id,
    to_character_id: r.to_character_id,
    relation_type: r.relation_type,
    description: r.description ?? undefined,
  }
}

function openAddRelation() {
  relationForm.from_character_id = ''
  relationForm.to_character_id = ''
  relationForm.relation_type = ''
  relationForm.description = ''
  relationError.value = ''
  showRelationForm.value = true
}

async function saveRelations() {
  const current = relations.value ?? []
  const payload = current.map(toRelationPayload)
  if (relationForm.from_character_id && relationForm.to_character_id && relationForm.relation_type) {
    payload.push({
      from_character_id: relationForm.from_character_id,
      to_character_id: relationForm.to_character_id,
      relation_type: relationForm.relation_type,
      description: relationForm.description || undefined,
    })
  }
  relationLoading.value = true
  relationError.value = ''
  try {
    await $api(`/api/projects/${projectId}/character-relations`, {
      method: 'PUT',
      body: { relations: payload },
    })
    showRelationForm.value = false
    refreshRelations()
  } catch (e: any) {
    relationError.value = e.data?.statusMessage || '保存失败'
  } finally {
    relationLoading.value = false
  }
}

async function removeRelation(index: number) {
  const current = relations.value ?? []
  const updated = current
    .filter((_, i) => i !== index)
    .map(toRelationPayload)
  try {
    await $api(`/api/projects/${projectId}/character-relations`, {
      method: 'PUT',
      body: { relations: updated },
    })
    refreshRelations()
  } catch (e: any) {
    relationError.value = e.data?.statusMessage || '删除失败'
  }
}

const editing = ref<any>(null)
const showForm = ref(false)
const confirmDelete = ref<any>(null)
const form = reactive({
  name: '',
  age: undefined as number | undefined,
  appearance: '',
  personality_tags: '',
  public_identity: '',
  real_identity: '',
  motivation: '',
  catchphrase: '',
  image_prompt: '',
})
const loading = ref(false)
const error = ref('')

function openCreate() {
  editing.value = null
  Object.assign(form, { name: '', age: null, appearance: '', personality_tags: '', public_identity: '', real_identity: '', motivation: '', catchphrase: '', image_prompt: '' })
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
    image_prompt: c.image_prompt || '',
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
    await refresh()
    loadAllLooks()
  } catch (e: any) {
    error.value = e.data?.message || e.data?.statusMessage || '操作失败'
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
    error.value = e.data?.message || e.data?.statusMessage || '删除失败'
  }
}
</script>

<template>
  <LayoutAppLayout>
    <template #title>{{ project?.title || '项目' }} — 角色</template>

    <CommonPageLoading v-if="projectStatus === 'pending'" />
    <CommonPageError v-else-if="projectError" :error="projectError" :retry-fn="refreshProject" />
    <div v-else class="max-w-5xl">
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
          class="bg-white rounded-xl border border-zinc-200/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
          @click="goToDetail(c.id)"
        >
          <div class="p-4">
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
          </div>

          <!-- Look thumbnails -->
          <div v-if="getLookThumbnails(c.id).length" class="px-4 pb-3">
            <p class="text-[10px] text-zinc-400 uppercase tracking-wider mb-1.5">形象</p>
            <ProjectEntityThumbnailRow
              :items="getLookThumbnails(c.id)"
              size="sm"
              @select="goToDetail(c.id)"
            />
          </div>

          <div class="flex gap-1 px-4 pb-3 pt-2 border-t border-zinc-100">
            <Button variant="ghost" size="sm" class="h-7 text-xs text-zinc-500 hover:text-indigo-600" @click.stop="openEdit(c)">
              <Pencil class="h-3 w-3 mr-1" /> 编辑
            </Button>
            <Button variant="ghost" size="sm" class="h-7 text-xs text-zinc-500 hover:text-indigo-600" @click.stop="goToDetail(c.id)">
              <ExternalLink class="h-3 w-3 mr-1" /> 详情
            </Button>
            <Button variant="ghost" size="sm" class="h-7 text-xs text-zinc-500 hover:text-red-600" @click.stop="confirmDelete = c">
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

      <Separator class="my-8" />

      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-zinc-900 flex items-center gap-2">
          <Link class="h-5 w-5 text-indigo-600" />
          角色关系
        </h2>
        <Button size="sm" variant="outline" class="gap-2" :disabled="!characters?.length" @click="openAddRelation">
          <Plus class="h-3.5 w-3.5" /> 添加关系
        </Button>
      </div>

      <div v-if="relations?.length" class="rounded-xl border border-zinc-200/60 overflow-hidden bg-white">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-zinc-200/60 bg-zinc-50/50">
              <th class="px-4 py-3 text-left font-medium text-zinc-600">角色 A</th>
              <th class="px-4 py-3 text-left font-medium text-zinc-600">关系类型</th>
              <th class="px-4 py-3 text-left font-medium text-zinc-600">角色 B</th>
              <th class="px-4 py-3 text-left font-medium text-zinc-600">描述</th>
              <th class="px-4 py-3 w-16" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in relations" :key="r.id" class="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/30">
              <td class="px-4 py-3 font-medium text-zinc-900">{{ getCharacterName(r.from_character_id) }}</td>
              <td class="px-4 py-3 text-zinc-600">
                <span class="inline-flex items-center gap-1">
                  <ArrowRight class="h-3.5 w-3.5 text-zinc-400" />
                  {{ r.relation_type || '—' }}
                </span>
              </td>
              <td class="px-4 py-3 font-medium text-zinc-900">{{ getCharacterName(r.to_character_id) }}</td>
              <td class="px-4 py-3 text-zinc-500 max-w-[200px] truncate">{{ r.description || '—' }}</td>
              <td class="px-4 py-3">
                <Button variant="ghost" size="sm" class="h-7 text-xs text-zinc-500 hover:text-red-600" @click="removeRelation(i)">
                  <Trash2 class="h-3 w-3" /> 删除
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-else class="text-sm text-zinc-500 py-4">暂无角色关系。添加角色后，可在此管理角色之间的关系。</p>
    </div>

    <!-- Character edit Sheet -->
    <Sheet :open="showForm" @update:open="(v: boolean) => { if (!v) showForm = false }">
      <SheetContent class="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{{ editing ? '编辑角色' : '新建角色' }}</SheetTitle>
        </SheetHeader>
        <form @submit.prevent="handleSubmit" class="space-y-4 mt-4">
          <div class="space-y-2"><Label>角色名 *</Label><Input v-model="form.name" required placeholder="输入角色名" /></div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2"><Label>年龄</Label><Input v-model.number="form.age" type="number" placeholder="如 25" /></div>
            <div class="space-y-2"><Label>公开身份</Label><Input v-model="form.public_identity" placeholder="如 甜品店老板" /></div>
          </div>
          <div class="space-y-2"><Label>真实身份</Label><Input v-model="form.real_identity" placeholder="如 集团继承人" /></div>
          <div class="space-y-2"><Label>性格标签</Label><Input v-model="form.personality_tags" placeholder="倔强, 善良, 聪明（逗号分隔）" /></div>
          <div class="space-y-2"><Label>外貌描述</Label><Textarea v-model="form.appearance" placeholder="描述角色外貌" rows="2" /></div>
          <div class="space-y-2"><Label>核心动机</Label><Textarea v-model="form.motivation" placeholder="角色的核心驱动力" rows="2" /></div>
          <div class="space-y-2"><Label>口头禅</Label><Input v-model="form.catchphrase" placeholder="角色的口头禅" /></div>
          <Separator />
          <div class="space-y-2"><Label>图像提示词</Label><Textarea v-model="form.image_prompt" placeholder="用于 AI 生成角色肖像的提示词" rows="3" /></div>
          <div v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{{ error }}</div>
          <div class="flex gap-2 pt-2">
            <Button type="button" variant="outline" @click="showForm = false" class="flex-1">取消</Button>
            <Button type="submit" :disabled="loading || !form.name" class="flex-1">{{ loading ? '保存中...' : (editing ? '保存修改' : '创建角色') }}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>

    <!-- Relation form Sheet -->
    <Sheet :open="showRelationForm" @update:open="(v: boolean) => { if (!v) showRelationForm = false }">
      <SheetContent class="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader><SheetTitle>添加角色关系</SheetTitle></SheetHeader>
        <form @submit.prevent="saveRelations" class="space-y-4 mt-4">
          <div class="space-y-2">
            <Label>角色 A</Label>
            <select v-model="relationForm.from_character_id" required class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              <option value="">请选择</option>
              <option v-for="c in characters" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="space-y-2">
            <Label>角色 B</Label>
            <select v-model="relationForm.to_character_id" required class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              <option value="">请选择</option>
              <option v-for="c in characters" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="space-y-2"><Label>关系类型</Label><Input v-model="relationForm.relation_type" required placeholder="如 兄妹、恋人、对手" /></div>
          <div class="space-y-2"><Label>描述</Label><Input v-model="relationForm.description" placeholder="可选，补充说明" /></div>
          <div v-if="relationError" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{{ relationError }}</div>
          <div class="flex gap-2 pt-2">
            <Button type="button" variant="outline" @click="showRelationForm = false" class="flex-1">取消</Button>
            <Button type="submit" :disabled="relationLoading" class="flex-1">{{ relationLoading ? '保存中...' : '添加' }}</Button>
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
