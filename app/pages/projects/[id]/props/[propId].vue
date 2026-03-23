<script setup lang="ts">
import { ArrowLeft, Plus, Pencil, Trash2, ChevronDown, ChevronRight, Box, Layers, ImageIcon, Film } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Prop, PropVariant, Storyboard } from '~/core/types'

const route = useRoute()
const projectId = route.params.id as string
const propId = route.params.propId as string
const { $api } = useApi()

const { data: prop, refresh: refreshProp } = useAsyncData(`prop-${propId}`, () => $api<Prop>(`/api/projects/${projectId}/props/${propId}`))
const { data: variants, refresh: refreshVariants } = useAsyncData(`prop-vars-${propId}`, () => $api<PropVariant[]>(`/api/projects/${projectId}/props/${propId}/variants`))
const { data: storyboards } = useAsyncData(`prop-sbs-${propId}`, () => $api<Storyboard[]>(`/api/projects/${projectId}/props/${propId}/storyboards`))

useHead({ title: computed(() => prop.value ? `${prop.value.name} - 道具详情` : '道具详情') })

const showBasicInfo = ref(false)

const heroItems = computed(() =>
  (variants.value ?? []).map(v => ({
    id: v.id,
    name: v.name,
    imageUrl: v.cover_asset_url || null,
    reviewStatus: v.review_status || 'draft',
    hasConfirmedCover: !!v.cover_asset_url,
  })),
)

function scrollToVariant(variantId: string) {
  document.getElementById(`variant-${variantId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function updateAssignee(userId: string | null) {
  try {
    await $api(`/api/projects/${projectId}/props/${propId}`, { method: 'PUT', body: { assigned_to: userId } })
    await refreshProp()
  } catch { toast.error('更新负责人失败') }
}

const showVariantForm = ref(false)
const editingVariant = ref<PropVariant | null>(null)
const variantForm = reactive({ name: '', description: '', image_prompt: '', variant_type: '' })
const variantLoading = ref(false)
const variantError = ref('')

function openVariantCreate() {
  editingVariant.value = null
  Object.assign(variantForm, { name: '', description: '', image_prompt: '', variant_type: '' })
  variantError.value = ''; showVariantForm.value = true
}
function openVariantEdit(v: PropVariant) {
  editingVariant.value = v
  Object.assign(variantForm, { name: v.name, description: v.description || '', image_prompt: v.image_prompt || '', variant_type: v.variant_type || '' })
  variantError.value = ''; showVariantForm.value = true
}
async function submitVariant() {
  variantError.value = ''; variantLoading.value = true
  try {
    const body = { ...variantForm, variant_type: variantForm.variant_type || undefined }
    if (editingVariant.value) await $api(`/api/projects/${projectId}/props/${propId}/variants/${editingVariant.value.id}`, { method: 'PUT', body })
    else await $api(`/api/projects/${projectId}/props/${propId}/variants`, { method: 'POST', body })
    showVariantForm.value = false; await refreshVariants()
  } catch (e: any) { variantError.value = e.data?.message || e.data?.statusMessage || '操作失败' }
  finally { variantLoading.value = false }
}
async function deleteVariant(id: string) {
  try { await $api(`/api/projects/${projectId}/props/${propId}/variants/${id}`, { method: 'DELETE' }); toast.success('已删除'); await refreshVariants() }
  catch (e: any) { toast.error(e.data?.message || '删除失败') }
}

const variantTypeMap: Record<string, string> = { style: '样式', condition: '状态', angle: '角度', detail: '细节' }
</script>

<template>
  <LayoutAppLayout>
    <template #title>道具详情</template>
    <div class="max-w-4xl">
      <!-- Header with assignee -->
      <div class="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" @click="navigateTo(`/projects/${projectId}/scenes`)"><ArrowLeft class="h-4 w-4" /></Button>
        <div class="flex-1 min-w-0">
          <h1 class="text-xl font-bold text-zinc-900 truncate">{{ prop?.name || '加载中...' }}</h1>
        </div>
        <ProjectAssigneePicker
          v-if="prop"
          :project-id="projectId"
          :model-value="prop.assigned_to"
          @update:model-value="updateAssignee"
        />
      </div>

      <div v-if="prop" class="space-y-6">
        <!-- Hero Section -->
        <ProjectDetailHeroSection v-if="heroItems.length" :items="heroItems" @click="scrollToVariant" />

        <!-- Basic info (collapsible) -->
        <div class="bg-white rounded-xl border border-zinc-200/60 shadow-sm overflow-hidden">
          <button type="button" class="w-full flex items-center justify-between px-6 py-4 hover:bg-zinc-50/50 transition-colors" @click="showBasicInfo = !showBasicInfo">
            <h2 class="text-sm font-semibold text-zinc-700 flex items-center gap-2"><Box class="h-4 w-4 text-amber-500" /> 基本信息</h2>
            <component :is="showBasicInfo ? ChevronDown : ChevronRight" class="h-4 w-4 text-zinc-400" />
          </button>
          <div v-if="showBasicInfo" class="px-6 pb-6 border-t border-zinc-100">
            <p v-if="prop.description" class="text-sm text-zinc-600 mt-4 mb-3">{{ prop.description }}</p>
            <div v-if="prop.tags?.length" class="flex flex-wrap gap-1.5 mt-2">
              <span v-for="tag in prop.tags" :key="tag" class="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">{{ tag }}</span>
            </div>
          </div>
        </div>

        <!-- Reference images -->
        <div class="bg-white rounded-xl border border-zinc-200/60 p-6 shadow-sm">
          <h2 class="text-sm font-semibold text-zinc-700 mb-4 flex items-center gap-2"><ImageIcon class="h-4 w-4 text-blue-500" /> 参考图</h2>
          <ProjectReferenceImageGallery :project-id="projectId" entity-type="prop" :entity-id="propId" />
        </div>

        <!-- Variants management (all expanded) -->
        <div class="bg-white rounded-xl border border-zinc-200/60 p-6 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-zinc-700 flex items-center gap-2"><Layers class="h-4 w-4 text-violet-500" /> 道具变体 ({{ variants?.length ?? 0 }})</h2>
            <Button variant="outline" size="sm" class="gap-1.5 text-xs h-7" @click="openVariantCreate"><Plus class="h-3 w-3" /> 添加变体</Button>
          </div>
          <div v-if="variants?.length" class="space-y-4">
            <div v-for="v in variants" :key="v.id" :id="`variant-${v.id}`" class="rounded-lg border border-zinc-100 overflow-hidden">
              <div class="flex items-center justify-between px-4 py-3 bg-zinc-50/30">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-zinc-700">{{ v.name }}</span>
                  <Badge v-if="v.variant_type" variant="secondary" class="text-[9px] px-1 py-0">{{ variantTypeMap[v.variant_type] || v.variant_type }}</Badge>
                  <span
                    v-if="v.review_status && v.review_status !== 'draft'"
                    class="text-[9px] px-1.5 py-0.5 rounded-full"
                    :class="v.review_status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
                  >
                    {{ v.review_status === 'confirmed' ? '已确认' : '审查中' }}
                  </span>
                </div>
                <div class="flex items-center gap-1">
                  <button type="button" class="h-6 w-6 rounded flex items-center justify-center text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50" @click.stop="openVariantEdit(v)"><Pencil class="h-3 w-3" /></button>
                  <button type="button" class="h-6 w-6 rounded flex items-center justify-center text-zinc-400 hover:text-red-600 hover:bg-red-50" @click.stop="deleteVariant(v.id)"><Trash2 class="h-3 w-3" /></button>
                </div>
              </div>
              <div class="px-4 pb-4">
                <div v-if="v.description" class="text-xs text-zinc-500 mt-2 mb-2">{{ v.description }}</div>
                <ProjectEntityImageGallery :project-id="projectId" entity-type="prop_variant" :entity-id="v.id" :image-prompt="v.image_prompt" @refresh="refreshVariants()" />
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-zinc-400 py-2">暂无变体</p>
        </div>

        <!-- Associated storyboards -->
        <div class="bg-white rounded-xl border border-zinc-200/60 p-6 shadow-sm">
          <h2 class="text-sm font-semibold text-zinc-700 mb-4 flex items-center gap-2"><Film class="h-4 w-4 text-amber-500" /> 关联分镜 ({{ storyboards?.length ?? 0 }})</h2>
          <div v-if="storyboards?.length" class="space-y-2">
            <div v-for="sb in storyboards" :key="sb.id" class="flex items-center gap-3 p-3 rounded-lg border border-zinc-100 hover:bg-zinc-50/50 transition-colors">
              <span class="text-xs font-mono text-zinc-400">#{{ sb.sequence_number }}</span>
              <span class="text-sm text-zinc-700 truncate flex-1">{{ sb.description || '未描述' }}</span>
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
          <div class="space-y-2"><Label>变体名称 *</Label><Input v-model="variantForm.name" required placeholder="如 破损版、特写版" /></div>
          <div class="space-y-2"><Label>变体类型</Label><select v-model="variantForm.variant_type" class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">不指定</option><option value="style">样式</option><option value="condition">状态</option><option value="angle">角度</option><option value="detail">细节</option></select></div>
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
