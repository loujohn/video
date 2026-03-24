<script setup lang="ts">
import { Folder, ChevronRight } from 'lucide-vue-next'
import type { Project } from '~/core/types'

interface Props {
  project?: Project | null
}

defineProps<Props>()

const PIPELINE = [
  { id: 'plan', label: '创作方案', icon: '📝' },
  { id: 'episodes', label: '分集目录', icon: '📋' },
  { id: 'characters', label: '角色开发', icon: '👤' },
  { id: 'scenes', label: '场景设计', icon: '🏞️' },
  { id: 'storyboards', label: '分镜脚本', icon: '🎬' },
  { id: 'images', label: '图片生成', icon: '🖼️' },
  { id: 'videos', label: '视频生成', icon: '📹' },
]
</script>

<template>
  <div class="w-[280px] bg-white border-l border-zinc-200 flex flex-col overflow-y-auto shrink-0">
    <!-- Project info -->
    <div class="p-4 border-b border-zinc-100">
      <div class="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">当前项目</div>
      <div v-if="project" class="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-lg p-3">
        <div class="text-sm font-semibold text-zinc-800">{{ project.title }}</div>
        <div class="text-xs text-zinc-500 mt-1">
          {{ (project as any).genre?.join('·') || '未设置题材' }} · {{ project.total_episodes || '?' }}集
        </div>
      </div>
      <div v-else class="text-xs text-zinc-400">
        未选择项目。开始对话后自动关联。
      </div>
    </div>

    <!-- Pipeline -->
    <div class="p-4 border-b border-zinc-100">
      <div class="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">创作流程</div>
      <div class="space-y-0.5">
        <div
          v-for="step in PIPELINE"
          :key="step.id"
          class="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-zinc-400 hover:bg-zinc-50 cursor-default"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-zinc-300 shrink-0" />
          <span>{{ step.icon }} {{ step.label }}</span>
        </div>
      </div>
    </div>

    <!-- Hint -->
    <div class="p-4 flex-1">
      <div class="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">提示</div>
      <p class="text-xs text-zinc-400 leading-relaxed">
        与 AI 助手对话来驱动创作流程。Agent 会自动调用系统工具来创建角色、场景、分镜等内容。
      </p>
    </div>
  </div>
</template>
