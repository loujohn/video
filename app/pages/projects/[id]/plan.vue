<script setup lang="ts">
import type { Project } from '~/core/types'

interface CreativePlanContent {
  logline?: string
  synopsis?: string
  theme?: string
  setting?: string
  target_audience?: string
  tone_style?: string
  key_conflicts?: string
  unique_selling_points?: string
  reference_works?: string
  notes?: string
}

interface PlanResponse {
  id: string
  content: CreativePlanContent
  version: number
}

const route = useRoute()
const projectId = route.params.id as string
const { $api } = useApi()

const { data: project, status: projectStatus, error: projectError, refresh: refreshProject } = useAsyncData(`project-${projectId}`, () =>
  $api<Project>(`/api/projects/${projectId}`),
)

useHead({ title: computed(() => project.value ? `${project.value.title} - 创作方案` : '创作方案') })

const { data: planData, pending: loading, refresh } = useAsyncData(
  `plan-${projectId}`,
  async () => {
    const res = await $api<PlanResponse | null>(`/api/projects/${projectId}/plan`)
    if (!res) return { id: '', content: {} as CreativePlanContent, version: 0 }
    return {
      id: res.id ?? '',
      content: res.content || ({} as CreativePlanContent),
      version: res.version ?? 0,
    }
  },
)

const form = reactive<CreativePlanContent>({
  logline: '',
  synopsis: '',
  theme: '',
  setting: '',
  target_audience: '',
  tone_style: '',
  key_conflicts: '',
  unique_selling_points: '',
  reference_works: '',
  notes: '',
})

const savedForm = ref<CreativePlanContent>({})

watch(
  planData,
  (data) => {
    if (data?.content) {
      const c = {
        logline: data.content.logline ?? '',
        synopsis: data.content.synopsis ?? '',
        theme: data.content.theme ?? '',
        setting: data.content.setting ?? '',
        target_audience: data.content.target_audience ?? '',
        tone_style: data.content.tone_style ?? '',
        key_conflicts: data.content.key_conflicts ?? '',
        unique_selling_points: data.content.unique_selling_points ?? '',
        reference_works: data.content.reference_works ?? '',
        notes: data.content.notes ?? '',
      }
      Object.assign(form, c)
      savedForm.value = { ...c }
    }
  },
  { immediate: true },
)

const hasUnsavedChanges = computed(() => {
  return JSON.stringify(form) !== JSON.stringify(savedForm.value)
})

const showSaveDialog = ref(false)
const changeSummary = ref('')
const saving = ref(false)
const error = ref('')
const showVersionHistory = ref(false)
const showComments = ref(false)
const autoSaveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')

const fields: { key: keyof CreativePlanContent; label: string; rows?: number }[] = [
  { key: 'logline', label: '一句话故事梗概', rows: 2 },
  { key: 'synopsis', label: '详细故事简介', rows: 4 },
  { key: 'theme', label: '主题', rows: 2 },
  { key: 'setting', label: '背景设定', rows: 3 },
  { key: 'target_audience', label: '目标受众分析', rows: 2 },
  { key: 'tone_style', label: '调性与风格描述', rows: 2 },
  { key: 'key_conflicts', label: '核心冲突', rows: 3 },
  { key: 'unique_selling_points', label: '独特卖点', rows: 2 },
  { key: 'reference_works', label: '参考作品', rows: 2 },
  { key: 'notes', label: '其他备注', rows: 3 },
]

function openSaveDialog() {
  changeSummary.value = ''
  error.value = ''
  showSaveDialog.value = true
}

function buildContent(): CreativePlanContent {
  const content: CreativePlanContent = {}
  for (const f of fields) {
    const v = form[f.key]
    if (v != null && v !== '') content[f.key] = v
  }
  return content
}

async function handleSave() {
  error.value = ''
  saving.value = true
  try {
    await $api(`/api/projects/${projectId}/plan`, {
      method: 'PUT',
      body: { content: buildContent(), change_summary: changeSummary.value || undefined },
    })
    savedForm.value = { ...form }
    showSaveDialog.value = false
    refresh()
  } catch (e: any) {
    error.value = e.data?.statusMessage || '保存失败'
  } finally {
    saving.value = false
  }
}

async function autoSave() {
  if (!hasUnsavedChanges.value || saving.value || showSaveDialog.value) return
  autoSaveStatus.value = 'saving'
  try {
    await $api(`/api/projects/${projectId}/plan`, {
      method: 'PUT',
      body: { content: buildContent(), change_summary: '自动保存' },
    })
    savedForm.value = { ...form }
    autoSaveStatus.value = 'saved'
    refresh()
    setTimeout(() => {
      if (autoSaveStatus.value === 'saved') autoSaveStatus.value = 'idle'
    }, 3000)
  } catch {
    autoSaveStatus.value = 'error'
  }
}

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null
watch(form, () => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  if (!showSaveDialog.value) {
    autoSaveTimer = setTimeout(autoSave, 30000)
  }
}, { deep: true })

function handleKeyDown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault()
    openSaveDialog()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <LayoutAppLayout>
    <template #title>{{ project?.title || '项目' }} — 创作方案</template>

    <CommonPageLoading v-if="projectStatus === 'pending'" />
    <CommonPageError v-else-if="projectError" :error="projectError" :retry-fn="refreshProject" />
    <div v-else class="max-w-5xl">
      <ProjectSubNav :project-id="projectId" />

      <div v-if="loading" class="flex items-center justify-center py-16 text-zinc-500">
        加载中...
      </div>

      <template v-else>
        <div class="bg-white rounded-2xl border border-zinc-200/60 p-6 shadow-sm">
          <form class="space-y-6" @submit.prevent>
            <div
              v-for="f in fields"
              :key="f.key"
              class="space-y-2"
            >
              <Label>{{ f.label }}</Label>
              <Textarea
                v-model="form[f.key]"
                :rows="f.rows ?? 3"
                :placeholder="`输入${f.label}`"
                class="resize-none"
              />
            </div>

            <div class="flex items-center justify-between pt-4 border-t border-zinc-100">
              <div class="flex items-center gap-3 text-sm text-zinc-500">
                <span>当前版本：v{{ planData?.version ?? 0 }}</span>
                <Badge v-if="hasUnsavedChanges" variant="outline" class="text-xs text-amber-600 border-amber-200 bg-amber-50">
                  未保存
                </Badge>
                <span v-if="autoSaveStatus === 'saving'" class="text-xs text-amber-500">自动保存中...</span>
                <span v-else-if="autoSaveStatus === 'saved'" class="text-xs text-emerald-500">已自动保存</span>
                <span v-else-if="autoSaveStatus === 'error'" class="text-xs text-red-500">自动保存失败</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-zinc-400 mr-2">Ctrl+S 保存</span>
                <Button v-if="planData?.id" type="button" variant="outline" size="sm" @click="showComments = !showComments">
                  {{ showComments ? '收起评论' : '评论' }}
                </Button>
                <Button v-if="planData?.id" type="button" variant="outline" size="sm" @click="showVersionHistory = true">
                  版本历史
                </Button>
                <Button type="button" @click="openSaveDialog">
                  保存
                </Button>
              </div>
            </div>
          </form>
        </div>
        <!-- Comment panel -->
        <div v-if="showComments && planData?.id" class="bg-white rounded-2xl border border-zinc-200/60 p-6 shadow-sm mt-6">
          <CommonCommentThread
            :project-id="projectId"
            entity-type="creative_plan"
            :entity-id="planData.id"
          />
        </div>
      </template>
    </div>

    <ProjectVersionHistorySheet
      v-if="planData?.id"
      :project-id="projectId"
      entity-type="creative_plan"
      :entity-id="planData.id"
      :open="showVersionHistory"
      @close="showVersionHistory = false"
    />

    <Dialog :open="showSaveDialog" @update:open="(v: boolean) => { if (!v) showSaveDialog = false }">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>保存创作方案</DialogTitle>
          <DialogDescription>可选填写本次修改的简要说明，便于版本追溯</DialogDescription>
        </DialogHeader>
        <div class="space-y-2 py-2">
          <Label>修改说明</Label>
          <Input
            v-model="changeSummary"
            placeholder="如：完善了主题与核心冲突"
          />
        </div>
        <div v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {{ error }}
        </div>
        <DialogFooter class="gap-2">
          <Button variant="outline" @click="showSaveDialog = false">取消</Button>
          <Button :disabled="saving" @click="handleSave">
            {{ saving ? '保存中...' : '保存' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </LayoutAppLayout>
</template>
