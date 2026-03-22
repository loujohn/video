<script setup lang="ts">
import { ArrowLeft, Plus, Pencil, Trash2, ChevronDown, ChevronRight, User, Shirt, ImageIcon, Film } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Character, CharacterLook, Storyboard } from '~/core/types'

const route = useRoute()
const projectId = route.params.id as string
const characterId = route.params.cid as string
const { $api } = useApi()

const { data: character, refresh: refreshChar } = useAsyncData(`char-${characterId}`, () =>
  $api<Character>(`/api/projects/${projectId}/characters/${characterId}`),
)

const { data: looks, refresh: refreshLooks } = useAsyncData(`char-looks-${characterId}`, () =>
  $api<CharacterLook[]>(`/api/projects/${projectId}/characters/${characterId}/looks`),
)

const { data: storyboards } = useAsyncData(`char-sbs-${characterId}`, () =>
  $api<Storyboard[]>(`/api/projects/${projectId}/characters/${characterId}/storyboards`),
)

const { data: relations } = useAsyncData(`char-rels-${projectId}`, () =>
  $api<any[]>(`/api/projects/${projectId}/character-relations`),
)

useHead({ title: computed(() => character.value ? `${character.value.name} - 角色详情` : '角色详情') })

const expandedLooks = ref<Set<string>>(new Set())

function toggleLook(lookId: string) {
  if (expandedLooks.value.has(lookId)) expandedLooks.value.delete(lookId)
  else expandedLooks.value.add(lookId)
}

const showLookForm = ref(false)
const editingLook = ref<CharacterLook | null>(null)
const lookForm = reactive({ name: '', description: '', image_prompt: '' })
const lookLoading = ref(false)
const lookError = ref('')

function openLookCreate() {
  editingLook.value = null
  Object.assign(lookForm, { name: '', description: '', image_prompt: '' })
  lookError.value = ''
  showLookForm.value = true
}

function openLookEdit(look: CharacterLook) {
  editingLook.value = look
  Object.assign(lookForm, { name: look.name, description: look.description || '', image_prompt: look.image_prompt || '' })
  lookError.value = ''
  showLookForm.value = true
}

async function submitLook() {
  lookError.value = ''
  lookLoading.value = true
  try {
    if (editingLook.value) {
      await $api(`/api/projects/${projectId}/characters/${characterId}/looks/${editingLook.value.id}`, { method: 'PUT', body: lookForm })
    } else {
      await $api(`/api/projects/${projectId}/characters/${characterId}/looks`, { method: 'POST', body: lookForm })
    }
    showLookForm.value = false
    await refreshLooks()
  } catch (e: any) {
    lookError.value = e.data?.message || e.data?.statusMessage || '操作失败'
  } finally {
    lookLoading.value = false
  }
}

async function deleteLook(lookId: string) {
  try {
    await $api(`/api/projects/${projectId}/characters/${characterId}/looks/${lookId}`, { method: 'DELETE' })
    toast.success('已删除形象')
    await refreshLooks()
  } catch (e: any) {
    toast.error(e.data?.message || '删除失败')
  }
}

const charRelations = computed(() => {
  if (!relations.value) return []
  return relations.value.filter(r => r.from_character_id === characterId || r.to_character_id === characterId)
})

function goBack() {
  navigateTo(`/projects/${projectId}/characters`)
}
</script>

<template>
  <LayoutAppLayout>
    <template #title>角色详情</template>

    <div class="max-w-4xl">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" @click="goBack">
          <ArrowLeft class="h-4 w-4" />
        </Button>
        <div class="flex-1 min-w-0">
          <h1 class="text-xl font-bold text-zinc-900 truncate">{{ character?.name || '加载中...' }}</h1>
          <p class="text-sm text-zinc-500">{{ character?.public_identity || '' }}</p>
        </div>
      </div>

      <div v-if="character" class="space-y-8">
        <!-- Basic info -->
        <div class="bg-white rounded-xl border border-zinc-200/60 p-6 shadow-sm">
          <h2 class="text-sm font-semibold text-zinc-700 mb-4 flex items-center gap-2">
            <User class="h-4 w-4 text-indigo-500" /> 基本信息
          </h2>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div v-if="character.age"><span class="text-zinc-400">年龄：</span><span class="text-zinc-700">{{ character.age }}</span></div>
            <div v-if="character.real_identity"><span class="text-zinc-400">真实身份：</span><span class="text-zinc-700">{{ character.real_identity }}</span></div>
            <div v-if="character.catchphrase" class="col-span-2"><span class="text-zinc-400">口头禅：</span><span class="text-zinc-700 italic">"{{ character.catchphrase }}"</span></div>
            <div v-if="character.appearance" class="col-span-2"><span class="text-zinc-400">外貌：</span><span class="text-zinc-700">{{ character.appearance }}</span></div>
            <div v-if="character.motivation" class="col-span-2"><span class="text-zinc-400">动机：</span><span class="text-zinc-700">{{ character.motivation }}</span></div>
          </div>
          <div v-if="character.personality_tags?.length" class="flex flex-wrap gap-1.5 mt-4">
            <span v-for="tag in character.personality_tags" :key="tag" class="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">{{ tag }}</span>
          </div>
        </div>

        <!-- Reference images -->
        <div class="bg-white rounded-xl border border-zinc-200/60 p-6 shadow-sm">
          <h2 class="text-sm font-semibold text-zinc-700 mb-4 flex items-center gap-2">
            <ImageIcon class="h-4 w-4 text-blue-500" /> 参考图
          </h2>
          <ProjectReferenceImageGallery :project-id="projectId" entity-type="character" :entity-id="characterId" />
        </div>

        <!-- Looks management -->
        <div class="bg-white rounded-xl border border-zinc-200/60 p-6 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-zinc-700 flex items-center gap-2">
              <Shirt class="h-4 w-4 text-violet-500" /> 角色形象 ({{ looks?.length ?? 0 }})
            </h2>
            <Button variant="outline" size="sm" class="gap-1.5 text-xs h-7" @click="openLookCreate">
              <Plus class="h-3 w-3" /> 添加形象
            </Button>
          </div>

          <div v-if="looks?.length" class="space-y-3">
            <div v-for="look in looks" :key="look.id" class="rounded-lg border border-zinc-100 overflow-hidden">
              <button
                type="button"
                class="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50/50 transition-colors"
                @click="toggleLook(look.id)"
              >
                <div class="flex items-center gap-2">
                  <component :is="expandedLooks.has(look.id) ? ChevronDown : ChevronRight" class="h-4 w-4 text-zinc-400" />
                  <span class="text-sm font-medium text-zinc-700">{{ look.name }}</span>
                  <Badge v-if="look.is_base" variant="secondary" class="text-[9px] px-1 py-0">基础</Badge>
                </div>
                <div class="flex items-center gap-1">
                  <button type="button" class="h-6 w-6 rounded flex items-center justify-center text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50" @click.stop="openLookEdit(look)">
                    <Pencil class="h-3 w-3" />
                  </button>
                  <button v-if="!look.is_base" type="button" class="h-6 w-6 rounded flex items-center justify-center text-zinc-400 hover:text-red-600 hover:bg-red-50" @click.stop="deleteLook(look.id)">
                    <Trash2 class="h-3 w-3" />
                  </button>
                </div>
              </button>
              <div v-if="expandedLooks.has(look.id)" class="px-4 pb-4 border-t border-zinc-50">
                <div v-if="look.description" class="text-xs text-zinc-500 mt-2 mb-2">{{ look.description }}</div>
                <ProjectEntityImageGallery
                  :project-id="projectId"
                  entity-type="character_look"
                  :entity-id="look.id"
                  :image-prompt="look.image_prompt"
                />
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-zinc-400 py-2">暂无形象</p>
        </div>

        <!-- Character relations -->
        <div v-if="charRelations.length" class="bg-white rounded-xl border border-zinc-200/60 p-6 shadow-sm">
          <h2 class="text-sm font-semibold text-zinc-700 mb-4">角色关系</h2>
          <div class="space-y-2">
            <div v-for="r in charRelations" :key="r.id" class="flex items-center gap-2 text-sm text-zinc-600">
              <span class="font-medium">{{ r.relation_type }}</span>
              <span class="text-zinc-400">→</span>
              <span>{{ r.from_character_id === characterId ? r.to_character_name : r.from_character_name }}</span>
              <span v-if="r.description" class="text-zinc-400 text-xs">（{{ r.description }}）</span>
            </div>
          </div>
        </div>

        <!-- Associated storyboards -->
        <div class="bg-white rounded-xl border border-zinc-200/60 p-6 shadow-sm">
          <h2 class="text-sm font-semibold text-zinc-700 mb-4 flex items-center gap-2">
            <Film class="h-4 w-4 text-amber-500" /> 关联分镜 ({{ storyboards?.length ?? 0 }})
          </h2>
          <div v-if="storyboards?.length" class="space-y-2">
            <div
              v-for="sb in storyboards"
              :key="sb.id"
              class="flex items-center gap-3 p-3 rounded-lg border border-zinc-100 hover:bg-zinc-50/50 transition-colors cursor-pointer"
              @click="navigateTo(`/projects/${projectId}/episodes/${1}/storyboards`)"
            >
              <span class="text-xs font-mono text-zinc-400">#{{ sb.sequence_number }}</span>
              <span class="text-sm text-zinc-700 truncate flex-1">{{ sb.description || '未描述' }}</span>
              <span v-if="sb.shot_type" class="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500">{{ sb.shot_type }}</span>
            </div>
          </div>
          <p v-else class="text-sm text-zinc-400 py-2">暂无关联分镜</p>
        </div>
      </div>
    </div>

    <!-- Look form Sheet -->
    <Sheet :open="showLookForm" @update:open="(v: boolean) => { if (!v) showLookForm = false }">
      <SheetContent class="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader><SheetTitle>{{ editingLook ? '编辑形象' : '新建形象' }}</SheetTitle></SheetHeader>
        <form @submit.prevent="submitLook" class="space-y-4 mt-4">
          <div class="space-y-2"><Label>形象名称 *</Label><Input v-model="lookForm.name" required placeholder="如 日常装扮、战斗装甲" /></div>
          <div class="space-y-2"><Label>描述</Label><Textarea v-model="lookForm.description" rows="3" placeholder="形象描述" /></div>
          <Separator />
          <div class="space-y-2"><Label>图像提示词</Label><Textarea v-model="lookForm.image_prompt" placeholder="用于 AI 生成该形象图的提示词" rows="3" /></div>
          <div v-if="lookError" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{{ lookError }}</div>
          <div class="flex gap-2 pt-2">
            <Button type="button" variant="outline" @click="showLookForm = false" class="flex-1">取消</Button>
            <Button type="submit" :disabled="lookLoading || !lookForm.name" class="flex-1">{{ lookLoading ? '保存中...' : '保存' }}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  </LayoutAppLayout>
</template>
