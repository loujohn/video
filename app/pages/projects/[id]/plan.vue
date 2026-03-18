<script setup lang="ts">
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

const { data: project } = useAsyncData(`project-${projectId}`, () =>
  $api<any>(`/api/projects/${projectId}`),
)

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

watch(
  planData,
  (data) => {
    if (data?.content) {
      Object.assign(form, {
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
      })
    }
  },
  { immediate: true },
)

const showSaveDialog = ref(false)
const changeSummary = ref('')
const saving = ref(false)
const error = ref('')
const showVersionHistory = ref(false)

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

async function handleSave() {
  error.value = ''
  saving.value = true
  try {
    const content: CreativePlanContent = {}
    for (const f of fields) {
      const v = form[f.key]
      if (v != null && v !== '') content[f.key] = v
    }
    await $api(`/api/projects/${projectId}/plan`, {
      method: 'PUT',
      body: { content, change_summary: changeSummary.value || undefined },
    })
    showSaveDialog.value = false
    refresh()
  } catch (e: any) {
    error.value = e.data?.statusMessage || '保存失败'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <LayoutAppLayout>
    <template #title>{{ project?.title || '项目' }} — 创作方案</template>

    <div class="max-w-5xl">
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
              <span class="text-sm text-zinc-500">
                当前版本：v{{ planData?.version ?? 0 }}
              </span>
              <div class="flex items-center gap-2">
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
