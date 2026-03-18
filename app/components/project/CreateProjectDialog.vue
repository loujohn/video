<script setup lang="ts">
const props = defineProps<{ open: boolean; teams: Array<{ id: string; name: string }> }>()
const emit = defineEmits<{
  (e: 'created', project: any): void
  (e: 'close'): void
}>()

const { $api } = useApi()
const form = reactive({
  team_id: '',
  title: '',
  genre: '',
  audience: '女频',
  tone: '甜',
  ending_type: 'HE',
  total_episodes: 60,
})
const loading = ref(false)
const error = ref('')

watch(() => props.open, (v) => {
  if (v && props.teams.length > 0 && !form.team_id) {
    form.team_id = props.teams[0].id
  }
})

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    const genreArr = form.genre ? form.genre.split(/[,，、]/).map(s => s.trim()).filter(Boolean) : []
    const project = await $api('/api/projects', {
      method: 'POST',
      body: { ...form, genre: genreArr },
    })
    emit('created', project)
  } catch (e: any) {
    error.value = e.data?.statusMessage || '创建失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="(v: boolean) => { if (!v) emit('close') }">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>新建项目</DialogTitle>
        <DialogDescription>填写基本信息创建一个新的短剧项目</DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-4 mt-2">
        <div class="space-y-2">
          <Label>团队</Label>
          <select v-model="form.team_id" class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>

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

        <div v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {{ error }}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="emit('close')">取消</Button>
          <Button type="submit" :disabled="loading || !form.title || !form.team_id">
            {{ loading ? '创建中...' : '创建项目' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
