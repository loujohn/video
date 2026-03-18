<script setup lang="ts">
const props = defineProps<{ open: boolean; project: any }>()
const emit = defineEmits<{
  (e: 'updated'): void
  (e: 'close'): void
}>()

const { $api } = useApi()
const form = reactive({
  title: '',
  genre: '',
  audience: '女频',
  tone: '甜',
  ending_type: 'HE',
  total_episodes: 60,
  status: 'draft',
})
const loading = ref(false)
const error = ref('')

watch(
  () => [props.open, props.project],
  () => {
    if (props.open && props.project) {
      Object.assign(form, {
        title: props.project.title || '',
        genre: Array.isArray(props.project.genre) ? props.project.genre.join(', ') : (props.project.genre || ''),
        audience: props.project.audience || '女频',
        tone: props.project.tone || '甜',
        ending_type: props.project.ending_type || 'HE',
        total_episodes: props.project.total_episodes ?? 60,
        status: props.project.status || 'draft',
      })
      error.value = ''
    }
  },
  { immediate: true },
)

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    const genreArr = form.genre ? form.genre.split(/[,，、]/).map(s => s.trim()).filter(Boolean) : []
    await $api(`/api/projects/${props.project.id}`, {
      method: 'PUT',
      body: { ...form, genre: genreArr },
    })
    emit('updated')
    emit('close')
  } catch (e: any) {
    error.value = e.data?.statusMessage || '更新失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="(v: boolean) => { if (!v) emit('close') }">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>编辑项目</DialogTitle>
        <DialogDescription>修改项目基本信息</DialogDescription>
      </DialogHeader>

      <form v-if="project" @submit.prevent="handleSubmit" class="space-y-4 mt-2">
        <div class="space-y-2">
          <Label>剧名</Label>
          <Input v-model="form.title" placeholder="输入剧名" required />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label>题材</Label>
            <Input v-model="form.genre" placeholder="霸道总裁, 甜宠" />
          </div>
          <div class="space-y-2">
            <Label>总集数</Label>
            <Input v-model.number="form.total_episodes" type="number" min="1" />
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div class="space-y-2">
            <Label>受众</Label>
            <select v-model="form.audience" class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="女频">女频</option>
              <option value="男频">男频</option>
              <option value="全年龄">全年龄</option>
            </select>
          </div>
          <div class="space-y-2">
            <Label>调性</Label>
            <select v-model="form.tone" class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="甜">甜</option>
              <option value="虐">虐</option>
              <option value="甜虐">甜虐</option>
              <option value="爽">爽</option>
              <option value="燃">燃</option>
              <option value="搞笑">搞笑</option>
            </select>
          </div>
          <div class="space-y-2">
            <Label>结局</Label>
            <select v-model="form.ending_type" class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="HE">HE</option>
              <option value="BE">BE</option>
              <option value="OE">OE</option>
            </select>
          </div>
        </div>

        <div class="space-y-2">
          <Label>状态</Label>
          <select v-model="form.status" class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="draft">草稿</option>
            <option value="in_progress">进行中</option>
            <option value="review">审核中</option>
            <option value="completed">已完成</option>
          </select>
        </div>

        <div v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {{ error }}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="emit('close')">取消</Button>
          <Button type="submit" :disabled="loading || !form.title">
            {{ loading ? '保存中...' : '保存' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
