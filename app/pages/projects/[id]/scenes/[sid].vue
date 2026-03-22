<script setup lang="ts">
import { ArrowLeft, Plus, Pencil, Trash2, ChevronDown, ChevronRight, MapPin, Layers, ImageIcon, Film } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Scene, SceneVariant, Storyboard } from '~/core/types'

const route = useRoute()
const projectId = route.params.id as string
const sceneId = route.params.sid as string
const { $api } = useApi()

const { data: scene } = useAsyncData(`scene-${sceneId}`, () => $api<Scene>(`/api/projects/${projectId}/scenes/${sceneId}`))
const { data: variants, refresh: refreshVariants } = useAsyncData(`scene-vars-${sceneId}`, () => $api<SceneVariant[]>(`/api/projects/${projectId}/scenes/${sceneId}/variants`))
const { data: storyboards } = useAsyncData(`scene-sbs-${sceneId}`, () => $api<Storyboard[]>(`/api/projects/${projectId}/scenes/${sceneId}/storyboards`))

useHead({ title: computed(() => scene.value ? `${scene.value.name} - 场景详情` : '场景详情') })

const expandedVariants = ref<Set<string>>(new Set())
function toggleVariant(id: string) { expandedVariants.value.has(id) ? expandedVariants.value.delete(id) : expandedVariants.value.add(id) }

const showVariantForm = ref(false)
const editingVariant = ref<SceneVariant | null>(null)
const variantForm = reactive({ name: '', description: '', image_prompt: '', variant_type: '' })
const variantLoading = ref(false)
const variantError = ref('')

function openVariantCreate() {
  editingVariant.value = null
  Object.assign(variantForm, { name: '', description: '', image_prompt: '', variant_type: '' })
  variantError.value = ''; showVariantForm.value = true
}
function openVariantEdit(v: SceneVariant) {
  editingVariant.value = v
  Object.assign(variantForm, { name: v.name, description: v.description || '', image_prompt: v.image_prompt || '', variant_type: v.variant_type || '' })
  variantError.value = ''; showVariantForm.value = true
}
async function submitVariant() {
  variantError.value = ''; variantLoading.value = true
  try {
    const body = { ...variantForm, variant_type: variantForm.variant_type || undefined }
    if (editingVariant.value) await $api(`/api/projects/${projectId}/scenes/${sceneId}/variants/${editingVariant.value.id}`, { method: 'PUT', body })
    else await $api(`/api/projects/${projectId}/scenes/${sceneId}/variants`, { method: 'POST', body })
    showVariantForm.value = false; await refreshVariants()
  } catch (e: any) { variantError.value = e.data?.message || e.data?.statusMessage || '操作失败' }
  finally { variantLoading.value = false }
}
async function deleteVariant(id: string) {
  try { await $api(`/api/projects/${projectId}/scenes/${sceneId}/variants/${id}`, { method: 'DELETE' }); toast.success('已删除'); await refreshVariants() }
  catch (e: any) { toast.error(e.data?.message || '删除失败') }
}

const variantTypeMap: Record<string, string> = { time: '时间', weather: '天气', angle: '角度', composition: '构图' }
const locationMap: Record<string, string> = { int: '室内', ext: '室外' }
const todMap: Record<string, string> = { day: '日景', night: '夜景', dawn: '黎明', dusk: '黄昏' }
</script>

<template>
  <LayoutAppLayout>
    <template #title>场景详情</template>
    <div class="max-w-4xl">
      <div class="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" @click="navigateTo(`/projects/${projectId}/scenes`)"><ArrowLeft class="h-4 w-4" /></Button>
        <div class="flex-1 min-w-0">
          <h1 class="text-xl font-bold text-zinc-900 truncate">{{ scene?.name || '加载中...' }}</h1>
          <p v-if="scene" class="text-sm text-zinc-500">{{ locationMap[scene.location_type] || scene.location_type }} · {{ todMap[scene.time_of_day] || scene.time_of_day }}</p>
        </div>
      </div>

      <div v-if="scene" class="space-y-8">
        <div class="bg-white rounded-xl border border-zinc-200/60 p-6 shadow-sm">
          <h2 class="text-sm font-semibold text-zinc-700 mb-4 flex items-center gap-2"><MapPin class="h-4 w-4 text-emerald-500" /> 基本信息</h2>
          <p v-if="scene.description" class="text-sm text-zinc-600 mb-3">{{ scene.description }}</p>
          <div v-if="scene.tags?.length" class="flex flex-wrap gap-1.5">
            <span v-for="tag in scene.tags" :key="tag" class="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">{{ tag }}</span>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-zinc-200/60 p-6 shadow-sm">
          <h2 class="text-sm font-semibold text-zinc-700 mb-4 flex items-center gap-2"><ImageIcon class="h-4 w-4 text-blue-500" /> 参考图</h2>
          <ProjectReferenceImageGallery :project-id="projectId" entity-type="scene" :entity-id="sceneId" />
        </div>

        <div class="bg-white rounded-xl border border-zinc-200/60 p-6 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-zinc-700 flex items-center gap-2"><Layers class="h-4 w-4 text-violet-500" /> 场景变体 ({{ variants?.length ?? 0 }})</h2>
            <Button variant="outline" size="sm" class="gap-1.5 text-xs h-7" @click="openVariantCreate"><Plus class="h-3 w-3" /> 添加变体</Button>
          </div>
          <div v-if="variants?.length" class="space-y-3">
            <div v-for="v in variants" :key="v.id" class="rounded-lg border border-zinc-100 overflow-hidden">
              <button type="button" class="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50/50 transition-colors" @click="toggleVariant(v.id)">
                <div class="flex items-center gap-2">
                  <component :is="expandedVariants.has(v.id) ? ChevronDown : ChevronRight" class="h-4 w-4 text-zinc-400" />
                  <span class="text-sm font-medium text-zinc-700">{{ v.name }}</span>
                  <Badge v-if="v.variant_type" variant="secondary" class="text-[9px] px-1 py-0">{{ variantTypeMap[v.variant_type] || v.variant_type }}</Badge>
                </div>
                <div class="flex items-center gap-1">
                  <button type="button" class="h-6 w-6 rounded flex items-center justify-center text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50" @click.stop="openVariantEdit(v)"><Pencil class="h-3 w-3" /></button>
                  <button type="button" class="h-6 w-6 rounded flex items-center justify-center text-zinc-400 hover:text-red-600 hover:bg-red-50" @click.stop="deleteVariant(v.id)"><Trash2 class="h-3 w-3" /></button>
                </div>
              </button>
              <div v-if="expandedVariants.has(v.id)" class="px-4 pb-4 border-t border-zinc-50">
                <div v-if="v.description" class="text-xs text-zinc-500 mt-2 mb-2">{{ v.description }}</div>
                <ProjectEntityImageGallery :project-id="projectId" entity-type="scene_variant" :entity-id="v.id" :image-prompt="v.image_prompt" />
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-zinc-400 py-2">暂无变体</p>
        </div>

        <div class="bg-white rounded-xl border border-zinc-200/60 p-6 shadow-sm">
          <h2 class="text-sm font-semibold text-zinc-700 mb-4 flex items-center gap-2"><Film class="h-4 w-4 text-amber-500" /> 关联分镜 ({{ storyboards?.length ?? 0 }})</h2>
          <div v-if="storyboards?.length" class="space-y-2">
            <div v-for="sb in storyboards" :key="sb.id" class="flex items-center gap-3 p-3 rounded-lg border border-zinc-100 hover:bg-zinc-50/50 transition-colors">
              <span class="text-xs font-mono text-zinc-400">#{{ sb.sequence_number }}</span>
              <span class="text-sm text-zinc-700 truncate flex-1">{{ sb.description || '未描述' }}</span>
              <span v-if="sb.shot_type" class="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500">{{ sb.shot_type }}</span>
            </div>
          </div>
          <p v-else class="text-sm text-zinc-400 py-2">暂无关联分镜</p>
        </div>
      </div>
    </div>

    <Sheet :open="showVariantForm" @update:open="(v: boolean) => { if (!v) showVariantForm = false }">
      <SheetContent class="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader><SheetTitle>{{ editingVariant ? '编辑变体' : '新建变体' }}</SheetTitle></SheetHeader>
        <form @submit.prevent="submitVariant" class="space-y-4 mt-4">
          <div class="space-y-2"><Label>变体名称 *</Label><Input v-model="variantForm.name" required placeholder="如 夜景版、雨天版" /></div>
          <div class="space-y-2"><Label>变体类型</Label><select v-model="variantForm.variant_type" class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">不指定</option><option value="time">时间</option><option value="weather">天气</option><option value="angle">角度</option><option value="composition">构图</option></select></div>
          <div class="space-y-2"><Label>描述</Label><Textarea v-model="variantForm.description" rows="3" placeholder="变体描述" /></div>
          <Separator />
          <div class="space-y-2"><Label>图像提示词</Label><Textarea v-model="variantForm.image_prompt" placeholder="用于 AI 生成该变体图的提示词" rows="3" /></div>
          <div v-if="variantError" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{{ variantError }}</div>
          <div class="flex gap-2 pt-2">
            <Button type="button" variant="outline" @click="showVariantForm = false" class="flex-1">取消</Button>
            <Button type="submit" :disabled="variantLoading || !variantForm.name" class="flex-1">{{ variantLoading ? '保存中...' : '保存' }}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  </LayoutAppLayout>
</template>
