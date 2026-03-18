<script setup lang="ts">
import type { Storyboard } from '~/core/types/storyboard'

const props = defineProps<{
  open: boolean
  storyboard?: Storyboard | null
  scenes: Array<{ id: string; name: string }>
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', data: Record<string, unknown>): void
}>()

const shotTypeOptions = [
  { value: 'close', label: '近景' },
  { value: 'medium', label: '中景' },
  { value: 'wide', label: '远景' },
  { value: 'pov', label: '主观' },
  { value: 'establishing', label: '全景' },
]

const transitionOptions = [
  { value: 'cut', label: '直切' },
  { value: 'dissolve', label: '溶解' },
  { value: 'fade', label: '淡入淡出' },
  { value: 'wipe', label: '擦除' },
]

const form = reactive({
  shot_type: '',
  scene_id: '',
  description: '',
  dialogue: '',
  action_direction: '',
  music_cue: '',
  duration_seconds: null as number | null,
  camera_movement: '',
  transition_type: '',
  reference_image_url: '',
})

watch(
  () => [props.open, props.storyboard] as const,
  ([open, sb]) => {
    if (open) {
      if (sb) {
        form.shot_type = sb.shot_type ?? ''
        form.scene_id = sb.scene_id ?? ''
        form.description = sb.description ?? ''
        form.dialogue = sb.dialogue ?? ''
        form.action_direction = sb.action_direction ?? ''
        form.music_cue = sb.music_cue ?? ''
        form.duration_seconds = sb.duration_seconds ?? null
        form.camera_movement = sb.camera_movement ?? ''
        form.transition_type = sb.transition_type ?? ''
        form.reference_image_url = sb.reference_image_url ?? ''
      } else {
        form.shot_type = ''
        form.scene_id = ''
        form.description = ''
        form.dialogue = ''
        form.action_direction = ''
        form.music_cue = ''
        form.duration_seconds = null
        form.camera_movement = ''
        form.transition_type = ''
        form.reference_image_url = ''
      }
    }
  },
  { immediate: true },
)

function handleSubmit() {
  const data: Record<string, unknown> = {
    shot_type: form.shot_type || undefined,
    scene_id: form.scene_id || undefined,
    description: form.description || undefined,
    dialogue: form.dialogue || undefined,
    action_direction: form.action_direction || undefined,
    music_cue: form.music_cue || undefined,
    duration_seconds: form.duration_seconds ?? undefined,
    camera_movement: form.camera_movement || undefined,
    transition_type: form.transition_type || undefined,
    reference_image_url: form.reference_image_url || undefined,
  }
  emit('submit', data)
}
</script>

<template>
  <Sheet :open="open" @update:open="(v: boolean) => { if (!v) emit('close') }">
    <SheetContent class="w-full sm:max-w-md overflow-y-auto">
      <SheetHeader>
        <SheetTitle>{{ storyboard ? '编辑分镜' : '新建分镜' }}</SheetTitle>
      </SheetHeader>
      <form @submit.prevent="handleSubmit" class="space-y-4 mt-4">
        <div class="space-y-2">
          <Label>镜头类型</Label>
          <select v-model="form.shot_type" class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">无</option>
            <option v-for="opt in shotTypeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <div class="space-y-2">
          <Label>场景</Label>
          <select v-model="form.scene_id" class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">无</option>
            <option v-for="s in scenes" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div class="space-y-2">
          <Label>画面描述</Label>
          <Textarea v-model="form.description" rows="3" placeholder="画面描述" />
        </div>
        <div class="space-y-2">
          <Label>台词</Label>
          <Textarea v-model="form.dialogue" rows="2" placeholder="台词" />
        </div>
        <div class="space-y-2">
          <Label>动作指示</Label>
          <Textarea v-model="form.action_direction" rows="2" placeholder="动作指示" />
        </div>
        <div class="space-y-2">
          <Label>音效/音乐</Label>
          <Input v-model="form.music_cue" placeholder="音效/音乐" />
        </div>
        <div class="space-y-2">
          <Label>时长秒数</Label>
          <Input v-model.number="form.duration_seconds" type="number" min="0" placeholder="时长（秒）" />
        </div>
        <div class="space-y-2">
          <Label>镜头运动</Label>
          <Input v-model="form.camera_movement" placeholder="镜头运动" />
        </div>
        <div class="space-y-2">
          <Label>转场类型</Label>
          <select v-model="form.transition_type" class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">无</option>
            <option v-for="opt in transitionOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <div class="space-y-2">
          <Label>参考图URL</Label>
          <Input v-model="form.reference_image_url" placeholder="参考图URL" />
        </div>
        <div class="flex gap-2 pt-2">
          <Button type="button" variant="outline" @click="emit('close')" class="flex-1">取消</Button>
          <Button type="submit" class="flex-1">保存</Button>
        </div>
      </form>
    </SheetContent>
  </Sheet>
</template>
