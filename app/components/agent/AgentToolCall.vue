<script setup lang="ts">
import { Wrench, Loader2, Check, AlertTriangle, ChevronDown } from 'lucide-vue-next'
import type { ToolCallInfo } from '~/composables/useAgentChat'

interface Props {
  toolCall: ToolCallInfo
}

const props = defineProps<Props>()
const expanded = ref(false)

const TOOL_LABELS: Record<string, string> = {
  list_teams: '列出团队',
  list_projects: '列出项目',
  create_project: '创建项目',
  get_project: '获取项目',
  update_project: '更新项目',
  get_creative_plan: '获取创作方案',
  save_creative_plan: '保存创作方案',
  list_characters: '列出角色',
  create_character: '创建角色',
  update_character: '更新角色',
  get_character: '获取角色',
  delete_character: '删除角色',
  get_character_relations: '获取角色关系',
  set_character_relations: '设置角色关系',
  list_episodes: '列出分集',
  create_episode: '创建分集',
  get_episode: '获取分集',
  update_episode: '更新分集',
  save_episode_script: '保存剧本',
  get_episode_script: '获取剧本',
  list_scenes: '列出场景',
  create_scene: '创建场景',
  list_storyboards: '列出分镜',
  create_storyboard: '创建分镜',
  update_storyboard: '更新分镜',
}

const displayName = computed(() => TOOL_LABELS[props.toolCall.name] || props.toolCall.name)

const TOOL_ENTITY_MAP: Record<string, string> = {
  create_project: 'project',
  get_project: 'project',
  create_character: 'character',
  get_character: 'character',
  create_episode: 'episode',
  get_episode: 'episode',
  create_scene: 'scene',
  create_storyboard: 'storyboard',
  save_creative_plan: 'creative_plan',
}

const parsedResultCard = computed(() => {
  if (!props.toolCall.result || props.toolCall.status !== 'done') return null
  const entityType = TOOL_ENTITY_MAP[props.toolCall.name]
  if (!entityType) return null
  try {
    const data = JSON.parse(props.toolCall.result)
    if (data && typeof data === 'object' && !data.error && (data.id || data.title || data.name)) {
      return { type: entityType, data }
    }
  }
  catch { /* not JSON */ }
  return null
})

const statusIcon = computed(() => {
  switch (props.toolCall.status) {
    case 'running': return Loader2
    case 'done': return Check
    case 'error': return AlertTriangle
  }
})

const statusClass = computed(() => {
  switch (props.toolCall.status) {
    case 'running': return 'text-amber-500 animate-spin'
    case 'done': return 'text-emerald-500'
    case 'error': return 'text-rose-500'
  }
})
</script>

<template>
  <div class="rounded-lg border border-zinc-200 bg-zinc-50 text-xs overflow-hidden">
    <button
      class="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-100 transition-colors"
      @click="expanded = !expanded"
    >
      <Wrench class="h-3 w-3 text-zinc-400 shrink-0" />
      <span class="text-zinc-600 font-medium">{{ displayName }}</span>
      <component :is="statusIcon" class="h-3 w-3 shrink-0 ml-auto" :class="statusClass" />
      <ChevronDown
        class="h-3 w-3 text-zinc-400 transition-transform shrink-0"
        :class="{ 'rotate-180': expanded }"
      />
    </button>

    <div v-if="expanded" class="border-t border-zinc-200 px-3 py-2 space-y-2">
      <div v-if="Object.keys(toolCall.args).length">
        <div class="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">参数</div>
        <pre class="text-[11px] text-zinc-600 bg-white rounded p-2 overflow-x-auto max-h-32">{{ JSON.stringify(toolCall.args, null, 2) }}</pre>
      </div>
      <div v-if="toolCall.result">
        <div class="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">结果</div>
        <AgentResultCard
          v-if="parsedResultCard"
          :type="parsedResultCard.type"
          :data="parsedResultCard.data"
        />
        <pre v-else class="text-[11px] text-zinc-600 bg-white rounded p-2 overflow-x-auto max-h-48">{{ toolCall.result.length > 500 ? toolCall.result.slice(0, 500) + '...' : toolCall.result }}</pre>
      </div>
    </div>
  </div>
</template>
