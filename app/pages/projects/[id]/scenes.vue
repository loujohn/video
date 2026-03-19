<script setup lang="ts">
import { Plus, MapPin, Box, Pencil, Trash2, MessageSquare } from 'lucide-vue-next'
import type { Project, Scene, Prop } from '~/core/types'

const route = useRoute()
const projectId = route.params.id as string
const { $api } = useApi()

const activeTab = ref('scenes')

const { data: project, status: projectStatus, error: projectError, refresh: refreshProject } = useAsyncData(`project-${projectId}`, () => $api<Project>(`/api/projects/${projectId}`))

useHead({ title: computed(() => project.value ? `${project.value.title} - 场景与道具` : '场景管理') })

const { data: scenes, refresh: refreshScenes } = useAsyncData(`scenes-${projectId}`, () =>
  $api<Scene[]>(`/api/projects/${projectId}/scenes`),
)

const { data: propsList, refresh: refreshProps } = useAsyncData(`props-${projectId}`, () =>
  $api<Prop[]>(`/api/projects/${projectId}/props`),
)

const showSceneForm = ref(false)
const editingScene = ref<any>(null)
const sceneForm = reactive({ name: '', location_type: 'int', time_of_day: 'day', description: '', tags: '', image_prompt: '' })
const sceneLoading = ref(false)
const sceneError = ref('')

function openSceneCreate() {
  editingScene.value = null
  Object.assign(sceneForm, { name: '', location_type: 'int', time_of_day: 'day', description: '', tags: '', image_prompt: '' })
  sceneError.value = ''
  showSceneForm.value = true
}

function openSceneEdit(s: any) {
  editingScene.value = s
  Object.assign(sceneForm, {
    name: s.name,
    location_type: s.location_type || 'int',
    time_of_day: s.time_of_day || 'day',
    description: s.description || '',
    tags: (s.tags || []).join(', '),
    image_prompt: s.image_prompt || '',
  })
  sceneError.value = ''
  showSceneForm.value = true
}

async function submitScene() {
  sceneError.value = ''
  sceneLoading.value = true
  try {
    const tagsArr = sceneForm.tags ? sceneForm.tags.split(/[,，、]/).map(s => s.trim()).filter(Boolean) : []
    const body = { ...sceneForm, tags: tagsArr }
    if (editingScene.value) {
      await $api(`/api/projects/${projectId}/scenes/${editingScene.value.id}`, { method: 'PUT', body })
    } else {
      await $api(`/api/projects/${projectId}/scenes`, { method: 'POST', body })
    }
    showSceneForm.value = false
    refreshScenes()
  } catch (e: any) {
    sceneError.value = e.data?.statusMessage || '操作失败'
  } finally {
    sceneLoading.value = false
  }
}

const showPropForm = ref(false)
const editingProp = ref<any>(null)
const propForm = reactive({ name: '', description: '', tags: '', image_prompt: '' })
const propLoading = ref(false)
const propError = ref('')

function openPropCreate() {
  editingProp.value = null
  Object.assign(propForm, { name: '', description: '', tags: '', image_prompt: '' })
  propError.value = ''
  showPropForm.value = true
}

function openPropEdit(p: any) {
  editingProp.value = p
  Object.assign(propForm, { name: p.name, description: p.description || '', tags: (p.tags || []).join(', '), image_prompt: p.image_prompt || '' })
  propError.value = ''
  showPropForm.value = true
}

async function submitProp() {
  propError.value = ''
  propLoading.value = true
  try {
    const tagsArr = propForm.tags ? propForm.tags.split(/[,，、]/).map(s => s.trim()).filter(Boolean) : []
    const body = { ...propForm, tags: tagsArr }
    if (editingProp.value) {
      await $api(`/api/projects/${projectId}/props/${editingProp.value.id}`, { method: 'PUT', body })
    } else {
      await $api(`/api/projects/${projectId}/props`, { method: 'POST', body })
    }
    showPropForm.value = false
    refreshProps()
  } catch (e: any) {
    propError.value = e.data?.statusMessage || '操作失败'
  } finally {
    propLoading.value = false
  }
}

const commentTarget = ref<{ type: 'scene' | 'prop'; id: string; name: string } | null>(null)
const showCommentSheet = ref(false)

function openEntityComments(type: 'scene' | 'prop', item: any) {
  commentTarget.value = { type, id: item.id, name: item.name }
  showCommentSheet.value = true
}

const deleteTarget = ref<{ type: 'scene' | 'prop'; id: string } | null>(null)
const showDeleteConfirm = ref(false)

function openDeleteScene(s: any) {
  deleteTarget.value = { type: 'scene', id: s.id }
  showDeleteConfirm.value = true
}

function openDeleteProp(p: any) {
  deleteTarget.value = { type: 'prop', id: p.id }
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  try {
    if (deleteTarget.value.type === 'scene') {
      await $api(`/api/projects/${projectId}/scenes/${deleteTarget.value.id}`, { method: 'DELETE' })
      refreshScenes()
    } else {
      await $api(`/api/projects/${projectId}/props/${deleteTarget.value.id}`, { method: 'DELETE' })
      refreshProps()
    }
    showDeleteConfirm.value = false
    deleteTarget.value = null
  } catch (e: any) {
    sceneError.value = e.data?.statusMessage || '删除失败'
  }
}

const locationMap: Record<string, string> = { int: '室内', ext: '室外' }
const todMap: Record<string, string> = { day: '日景', night: '夜景', dawn: '黎明', dusk: '黄昏' }
</script>

<template>
  <LayoutAppLayout>
    <template #title>{{ project?.title || '项目' }} — 场景与道具</template>

    <CommonPageLoading v-if="projectStatus === 'pending'" />
    <CommonPageError v-else-if="projectError" :error="projectError" :retry-fn="refreshProject" />
    <div v-else class="max-w-5xl">
      <ProjectSubNav :project-id="projectId" />

      <div class="flex items-center gap-1 mb-6">
        <button
          v-for="tab in [{ key: 'scenes', label: '场景', icon: MapPin }, { key: 'props', label: '道具', icon: Box }]"
          :key="tab.key"
          :class="[
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            activeTab === tab.key ? 'bg-indigo-50 text-indigo-700' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50',
          ]"
          @click="activeTab = tab.key"
        >
          <component :is="tab.icon" class="h-4 w-4" />
          {{ tab.label }}
        </button>
        <div class="flex-1" />
        <Button v-if="activeTab === 'scenes'" @click="openSceneCreate" size="sm" class="gap-2">
          <Plus class="h-3.5 w-3.5" /> 新建场景
        </Button>
        <Button v-else @click="openPropCreate" size="sm" class="gap-2">
          <Plus class="h-3.5 w-3.5" /> 新建道具
        </Button>
      </div>

      <div v-if="activeTab === 'scenes'">
        <div v-if="scenes?.length" class="space-y-3">
          <div
            v-for="s in scenes"
            :key="s.id"
            class="bg-white rounded-xl border border-zinc-200/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            <div class="flex items-center justify-between p-4">
              <div class="flex items-center gap-3">
                <div class="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <MapPin class="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h3 class="text-sm font-medium text-zinc-900">{{ s.name }}</h3>
                  <p class="text-xs text-zinc-400">
                    {{ (s.location_type && locationMap[s.location_type]) || s.location_type }} · {{ (s.time_of_day && todMap[s.time_of_day]) || s.time_of_day }}
                  </p>
                </div>
                <div v-if="s.tags?.length" class="flex gap-1 ml-2">
                  <span v-for="tag in s.tags.slice(0, 3)" :key="tag" class="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600">{{ tag }}</span>
                </div>
              </div>
              <div class="flex items-center gap-1">
                <Button variant="ghost" size="sm" class="h-7 text-xs text-zinc-400 hover:text-indigo-600" @click="openEntityComments('scene', s)">
                  <MessageSquare class="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" class="h-7 text-xs text-zinc-400" @click="openSceneEdit(s)">
                  <Pencil class="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" class="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50" @click="openDeleteScene(s)">
                  <Trash2 class="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div class="px-4 pb-3">
              <ProjectEntityImageGallery
                :project-id="projectId"
                entity-type="scene"
                :entity-id="s.id"
                :image-prompt="s.image_prompt"
              />
            </div>
          </div>
        </div>
        <CommonEmptyState v-else :icon="MapPin" title="暂无场景" description="添加拍摄场景">
          <Button @click="openSceneCreate" size="sm" class="gap-2"><Plus class="h-3.5 w-3.5" /> 新建场景</Button>
        </CommonEmptyState>
      </div>

      <div v-if="activeTab === 'props'">
        <div v-if="propsList?.length" class="space-y-3">
          <div
            v-for="p in propsList"
            :key="p.id"
            class="bg-white rounded-xl border border-zinc-200/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            <div class="flex items-center justify-between p-4">
              <div class="flex items-center gap-3">
                <div class="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Box class="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <h3 class="text-sm font-medium text-zinc-900">{{ p.name }}</h3>
                  <p v-if="p.description" class="text-xs text-zinc-400 truncate max-w-xs">{{ p.description }}</p>
                </div>
              </div>
              <div class="flex items-center gap-1">
                <Button variant="ghost" size="sm" class="h-7 text-xs text-zinc-400 hover:text-indigo-600" @click="openEntityComments('prop', p)">
                  <MessageSquare class="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" class="h-7 text-xs text-zinc-400" @click="openPropEdit(p)">
                  <Pencil class="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" class="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50" @click="openDeleteProp(p)">
                  <Trash2 class="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div class="px-4 pb-3">
              <ProjectEntityImageGallery
                :project-id="projectId"
                entity-type="prop"
                :entity-id="p.id"
                :image-prompt="p.image_prompt"
              />
            </div>
          </div>
        </div>
        <CommonEmptyState v-else :icon="Box" title="暂无道具" description="添加关键道具">
          <Button @click="openPropCreate" size="sm" class="gap-2"><Plus class="h-3.5 w-3.5" /> 新建道具</Button>
        </CommonEmptyState>
      </div>
    </div>

    <Sheet :open="showSceneForm" @update:open="(v: boolean) => { if (!v) showSceneForm = false }">
      <SheetContent class="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{{ editingScene ? '编辑场景' : '新建场景' }}</SheetTitle>
        </SheetHeader>
        <form @submit.prevent="submitScene" class="space-y-4 mt-4">
          <div class="space-y-2"><Label>场景名 *</Label><Input v-model="sceneForm.name" required placeholder="如 念念甜品屋" /></div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>内/外景</Label>
              <select v-model="sceneForm.location_type" class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="int">室内</option><option value="ext">室外</option>
              </select>
            </div>
            <div class="space-y-2">
              <Label>时间</Label>
              <select v-model="sceneForm.time_of_day" class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="day">日景</option><option value="night">夜景</option><option value="dawn">黎明</option><option value="dusk">黄昏</option>
              </select>
            </div>
          </div>
          <div class="space-y-2"><Label>描述</Label><Textarea v-model="sceneForm.description" rows="3" placeholder="场景描述" /></div>
          <div class="space-y-2"><Label>标签</Label><Input v-model="sceneForm.tags" placeholder="温馨, 浪漫（逗号分隔）" /></div>
          <Separator />

          <div class="space-y-2">
            <Label>图像提示词</Label>
            <Textarea v-model="sceneForm.image_prompt" placeholder="用于 AI 生成场景图的提示词" rows="3" />
          </div>

          <div v-if="editingScene" class="space-y-2">
            <Label>关联图片</Label>
            <ProjectEntityImageGallery
              :project-id="projectId"
              entity-type="scene"
              :entity-id="editingScene.id"
            />
          </div>

          <div v-if="sceneError" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{{ sceneError }}</div>
          <div class="flex gap-2 pt-2">
            <Button type="button" variant="outline" @click="showSceneForm = false" class="flex-1">取消</Button>
            <Button type="submit" :disabled="sceneLoading || !sceneForm.name" class="flex-1">{{ sceneLoading ? '保存中...' : '保存' }}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>

    <Sheet :open="showPropForm" @update:open="(v: boolean) => { if (!v) showPropForm = false }">
      <SheetContent class="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{{ editingProp ? '编辑道具' : '新建道具' }}</SheetTitle>
        </SheetHeader>
        <form @submit.prevent="submitProp" class="space-y-4 mt-4">
          <div class="space-y-2"><Label>道具名 *</Label><Input v-model="propForm.name" required placeholder="如 家族戒指" /></div>
          <div class="space-y-2"><Label>描述</Label><Textarea v-model="propForm.description" rows="3" placeholder="道具描述和用途" /></div>
          <div class="space-y-2"><Label>标签</Label><Input v-model="propForm.tags" placeholder="关键道具, 剧情推动（逗号分隔）" /></div>
          <Separator />

          <div class="space-y-2">
            <Label>图像提示词</Label>
            <Textarea v-model="propForm.image_prompt" placeholder="用于 AI 生成道具图的提示词" rows="3" />
          </div>

          <div v-if="editingProp" class="space-y-2">
            <Label>关联图片</Label>
            <ProjectEntityImageGallery
              :project-id="projectId"
              entity-type="prop"
              :entity-id="editingProp.id"
            />
          </div>

          <div v-if="propError" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{{ propError }}</div>
          <div class="flex gap-2 pt-2">
            <Button type="button" variant="outline" @click="showPropForm = false" class="flex-1">取消</Button>
            <Button type="submit" :disabled="propLoading || !propForm.name" class="flex-1">{{ propLoading ? '保存中...' : '保存' }}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>

    <CommonConfirmDialog
      :open="showDeleteConfirm"
      title="确认删除"
      :description="deleteTarget?.type === 'scene' ? '确定要删除该场景吗？' : '确定要删除该道具吗？'"
      confirm-text="删除"
      destructive
      @confirm="handleDelete"
      @cancel="showDeleteConfirm = false; deleteTarget = null"
    />

    <Sheet :open="showCommentSheet" @update:open="(v: boolean) => { if (!v) { showCommentSheet = false; commentTarget = null } }">
      <SheetContent class="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{{ commentTarget?.name }} — 评论</SheetTitle>
        </SheetHeader>
        <div class="mt-4">
          <CommonCommentThread
            v-if="commentTarget"
            :project-id="projectId"
            :entity-type="commentTarget.type"
            :entity-id="commentTarget.id"
          />
        </div>
      </SheetContent>
    </Sheet>
  </LayoutAppLayout>
</template>
