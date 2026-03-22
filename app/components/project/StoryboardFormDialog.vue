<script setup lang="ts">
import type { Storyboard, StoryboardWithAssociations } from '~/core/types/storyboard'
import type { SceneVariant } from '~/core/types/scene-variant'
import type { CharacterLook } from '~/core/types/character-look'
import type { PropVariant } from '~/core/types/prop-variant'
import type { Character, Prop } from '~/core/types'

const props = defineProps<{
  open: boolean
  storyboard?: StoryboardWithAssociations | Storyboard | null
  scenes: Array<{ id: string; name: string }>
  projectId?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', data: Record<string, unknown>): void
}>()

const { $api } = useApi()

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
  scene_variant_id: '',
  description: '',
  dialogue: '',
  action_direction: '',
  music_cue: '',
  duration_seconds: undefined as number | undefined,
  camera_movement: '',
  transition_type: '',
  reference_image_url: '',
  image_prompt: '',
  character_look_ids: [] as string[],
  prop_variant_ids: [] as string[],
})

// Cascaded data
const sceneVariants = ref<SceneVariant[]>([])
const characters = ref<Character[]>([])
const characterLooksMap = ref<Record<string, CharacterLook[]>>({})
const propsList = ref<Prop[]>([])
const propVariantsMap = ref<Record<string, PropVariant[]>>({})

async function loadSceneVariants(sceneId: string) {
  if (!sceneId || !props.projectId) { sceneVariants.value = []; return }
  try { sceneVariants.value = await $api<SceneVariant[]>(`/api/projects/${props.projectId}/scenes/${sceneId}/variants`) }
  catch { sceneVariants.value = [] }
}

async function loadCharactersAndLooks() {
  if (!props.projectId) return
  try {
    characters.value = await $api<Character[]>(`/api/projects/${props.projectId}/characters`)
    for (const c of characters.value) {
      characterLooksMap.value[c.id] = await $api<CharacterLook[]>(`/api/projects/${props.projectId}/characters/${c.id}/looks`)
    }
  } catch {}
}

async function loadPropsAndVariants() {
  if (!props.projectId) return
  try {
    propsList.value = await $api<Prop[]>(`/api/projects/${props.projectId}/props`)
    for (const p of propsList.value) {
      propVariantsMap.value[p.id] = await $api<PropVariant[]>(`/api/projects/${props.projectId}/props/${p.id}/variants`)
    }
  } catch {}
}

const allCharacterLooks = computed(() => {
  const list: Array<{ lookId: string; label: string }> = []
  for (const c of characters.value) {
    const looks = characterLooksMap.value[c.id] || []
    for (const l of looks) list.push({ lookId: l.id, label: `${c.name} - ${l.name}` })
  }
  return list
})

const allPropVariants = computed(() => {
  const list: Array<{ variantId: string; label: string }> = []
  for (const p of propsList.value) {
    const vars = propVariantsMap.value[p.id] || []
    for (const v of vars) list.push({ variantId: v.id, label: `${p.name} - ${v.name}` })
  }
  return list
})

watch(() => form.scene_id, (val) => {
  loadSceneVariants(val)
  if (!val) form.scene_variant_id = ''
})

function toggleCharacterLook(lookId: string) {
  const idx = form.character_look_ids.indexOf(lookId)
  if (idx >= 0) form.character_look_ids.splice(idx, 1)
  else form.character_look_ids.push(lookId)
}

function togglePropVariant(variantId: string) {
  const idx = form.prop_variant_ids.indexOf(variantId)
  if (idx >= 0) form.prop_variant_ids.splice(idx, 1)
  else form.prop_variant_ids.push(variantId)
}

watch(
  () => [props.open, props.storyboard] as const,
  async ([open, sb]) => {
    if (open) {
      await Promise.all([loadCharactersAndLooks(), loadPropsAndVariants()])
      if (sb) {
        form.shot_type = sb.shot_type ?? ''
        form.scene_id = sb.scene_id ?? ''
        form.scene_variant_id = sb.scene_variant_id ?? ''
        form.description = sb.description ?? ''
        form.dialogue = sb.dialogue ?? ''
        form.action_direction = sb.action_direction ?? ''
        form.music_cue = sb.music_cue ?? ''
        form.duration_seconds = sb.duration_seconds ?? undefined
        form.camera_movement = sb.camera_movement ?? ''
        form.transition_type = sb.transition_type ?? ''
        form.reference_image_url = sb.reference_image_url ?? ''
        form.image_prompt = sb.image_prompt ?? ''
        const withAssoc = sb as StoryboardWithAssociations
        form.character_look_ids = withAssoc.character_looks?.map(cl => cl.id) || []
        form.prop_variant_ids = withAssoc.prop_variants?.map(pv => pv.id) || []
        if (form.scene_id) await loadSceneVariants(form.scene_id)
      } else {
        Object.assign(form, {
          shot_type: '', scene_id: '', scene_variant_id: '', description: '',
          dialogue: '', action_direction: '', music_cue: '', duration_seconds: undefined,
          camera_movement: '', transition_type: '', reference_image_url: '', image_prompt: '',
          character_look_ids: [], prop_variant_ids: [],
        })
      }
    }
  },
  { immediate: true },
)

function handleSubmit() {
  const data: Record<string, unknown> = {
    shot_type: form.shot_type || undefined,
    scene_id: form.scene_id || undefined,
    scene_variant_id: form.scene_variant_id || undefined,
    description: form.description || undefined,
    dialogue: form.dialogue || undefined,
    action_direction: form.action_direction || undefined,
    music_cue: form.music_cue || undefined,
    duration_seconds: form.duration_seconds ?? undefined,
    camera_movement: form.camera_movement || undefined,
    transition_type: form.transition_type || undefined,
    reference_image_url: form.reference_image_url || undefined,
    image_prompt: form.image_prompt || undefined,
    character_look_ids: form.character_look_ids,
    prop_variant_ids: form.prop_variant_ids,
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

        <!-- Scene -> Variant cascade -->
        <div class="space-y-2">
          <Label>场景</Label>
          <select v-model="form.scene_id" class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">无</option>
            <option v-for="s in scenes" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div v-if="form.scene_id && sceneVariants.length" class="space-y-2">
          <Label>场景变体</Label>
          <select v-model="form.scene_variant_id" class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">不指定变体</option>
            <option v-for="sv in sceneVariants" :key="sv.id" :value="sv.id">{{ sv.name }}</option>
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

        <Separator />

        <!-- Character looks multi-select -->
        <div class="space-y-2">
          <Label>角色形象（多选）</Label>
          <div v-if="allCharacterLooks.length" class="max-h-40 overflow-y-auto rounded-md border border-input p-2 space-y-1">
            <label
              v-for="cl in allCharacterLooks" :key="cl.lookId"
              class="flex items-center gap-2 px-2 py-1 rounded hover:bg-zinc-50 cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                :checked="form.character_look_ids.includes(cl.lookId)"
                class="h-3.5 w-3.5 rounded border-zinc-300"
                @change="toggleCharacterLook(cl.lookId)"
              />
              {{ cl.label }}
            </label>
          </div>
          <p v-else class="text-xs text-zinc-400">暂无角色形象可选</p>
        </div>

        <!-- Prop variants multi-select -->
        <div class="space-y-2">
          <Label>道具变体（多选）</Label>
          <div v-if="allPropVariants.length" class="max-h-40 overflow-y-auto rounded-md border border-input p-2 space-y-1">
            <label
              v-for="pv in allPropVariants" :key="pv.variantId"
              class="flex items-center gap-2 px-2 py-1 rounded hover:bg-zinc-50 cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                :checked="form.prop_variant_ids.includes(pv.variantId)"
                class="h-3.5 w-3.5 rounded border-zinc-300"
                @change="togglePropVariant(pv.variantId)"
              />
              {{ pv.label }}
            </label>
          </div>
          <p v-else class="text-xs text-zinc-400">暂无道具变体可选</p>
        </div>

        <Separator />

        <div class="space-y-2">
          <Label>参考图URL</Label>
          <Input v-model="form.reference_image_url" placeholder="参考图URL" />
        </div>
        <div class="space-y-2">
          <Label>图像提示词</Label>
          <Textarea v-model="form.image_prompt" placeholder="用于 AI 生成分镜参考图的提示词" rows="3" />
        </div>

        <div class="flex gap-2 pt-2">
          <Button type="button" variant="outline" @click="emit('close')" class="flex-1">取消</Button>
          <Button type="submit" class="flex-1">保存</Button>
        </div>
      </form>
    </SheetContent>
  </Sheet>
</template>
