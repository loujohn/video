<script setup lang="ts">
import { MessageSquare, Send, Check, Reply, Trash2 } from 'lucide-vue-next'
import type { CommentWithAuthor, CommentEntityType } from '~/core/types'

const props = defineProps<{
  projectId: string
  entityType: CommentEntityType
  entityId: string
}>()

const { $api } = useApi()
const { user } = useAuth()

const { data: comments, refresh } = useAsyncData(
  `comments-${props.entityType}-${props.entityId}`,
  () => $api<CommentWithAuthor[]>(
    `/api/projects/${props.projectId}/comments?entity_type=${props.entityType}&entity_id=${props.entityId}`,
  ),
  { watch: [() => props.entityId] },
)

const { data: teamMembers } = useAsyncData(
  `team-members-for-comments`,
  async () => {
    const project = await $api<{ team_id: string }>(`/api/projects/${props.projectId}`)
    return $api<{ user_id: string; user_name: string; user_email: string }[]>(`/api/teams/${project.team_id}/members`)
  },
)

const newContent = ref('')
const replyingTo = ref<string | null>(null)
const replyContent = ref('')
const sending = ref(false)
const showMentionDropdown = ref(false)
const mentionSearch = ref('')
const newMentions = ref<string[]>([])
const replyMentions = ref<string[]>([])

const filteredMembers = computed(() => {
  if (!teamMembers.value) return []
  const search = mentionSearch.value.toLowerCase()
  return teamMembers.value
    .filter(m => m.user_id !== user.value?.id)
    .filter(m => !search || m.user_name.toLowerCase().includes(search) || m.user_email.toLowerCase().includes(search))
})

function handleInput(e: Event, target: 'new' | 'reply') {
  const textarea = e.target as HTMLTextAreaElement
  const val = textarea.value
  const cursorPos = textarea.selectionStart
  const textBeforeCursor = val.slice(0, cursorPos)
  const atMatch = textBeforeCursor.match(/@(\w*)$/)

  if (atMatch) {
    mentionSearch.value = atMatch[1] || ''
    showMentionDropdown.value = true
  } else {
    showMentionDropdown.value = false
  }
}

function insertMention(member: { user_id: string; user_name: string }, target: 'new' | 'reply') {
  const ref_ = target === 'new' ? newContent : replyContent
  const mentionsRef = target === 'new' ? newMentions : replyMentions
  const val = ref_.value
  const atIdx = val.lastIndexOf('@')
  if (atIdx >= 0) {
    ref_.value = val.slice(0, atIdx) + `@${member.user_name} ` + val.slice(atIdx + 1 + mentionSearch.value.length)
  }
  if (!mentionsRef.value.includes(member.user_id)) {
    mentionsRef.value.push(member.user_id)
  }
  showMentionDropdown.value = false
}

async function submitComment() {
  if (!newContent.value.trim()) return
  sending.value = true
  try {
    await $api(`/api/projects/${props.projectId}/comments`, {
      method: 'POST',
      body: {
        entity_type: props.entityType,
        entity_id: props.entityId,
        content: newContent.value,
        mentions: newMentions.value.length ? newMentions.value : undefined,
      },
    })
    newContent.value = ''
    newMentions.value = []
    await refresh()
  } catch {} finally {
    sending.value = false
  }
}

async function submitReply(parentId: string) {
  if (!replyContent.value.trim()) return
  sending.value = true
  try {
    await $api(`/api/projects/${props.projectId}/comments`, {
      method: 'POST',
      body: {
        entity_type: props.entityType,
        entity_id: props.entityId,
        content: replyContent.value,
        parent_id: parentId,
        mentions: replyMentions.value.length ? replyMentions.value : undefined,
      },
    })
    replyContent.value = ''
    replyingTo.value = null
    replyMentions.value = []
    await refresh()
  } catch {} finally {
    sending.value = false
  }
}

async function resolveComment(commentId: string) {
  try {
    await $api(`/api/projects/${props.projectId}/comments/${commentId}`, {
      method: 'PUT',
      body: { status: 'resolved' },
    })
    await refresh()
  } catch {}
}

async function deleteComment(commentId: string) {
  try {
    await $api(`/api/projects/${props.projectId}/comments/${commentId}`, { method: 'DELETE' })
    await refresh()
  } catch {}
}

function startReply(commentId: string) {
  replyingTo.value = commentId
  replyContent.value = ''
  replyMentions.value = []
}
</script>

<template>
  <div class="space-y-4">
    <!-- Comment list -->
    <div v-if="comments?.length" class="space-y-3">
      <div
        v-for="comment in comments"
        :key="comment.id"
        class="group"
      >
        <!-- Top-level comment -->
        <div
          class="rounded-lg border p-3 transition-colors"
          :class="comment.status === 'resolved' ? 'border-zinc-100 bg-zinc-50/50' : 'border-zinc-200/60 bg-white'"
        >
          <div class="flex items-start gap-2.5">
            <div class="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center shrink-0">
              <span class="text-xs font-semibold text-indigo-600">{{ comment.author_name?.charAt(0) || '?' }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-zinc-800">{{ comment.author_name }}</span>
                <span class="text-[10px] text-zinc-400">{{ formatTime(comment.created_at) }}</span>
                <Badge
                  v-if="comment.status === 'resolved'"
                  variant="secondary"
                  class="text-[10px] bg-emerald-50 text-emerald-600"
                >
                  已解决
                </Badge>
              </div>
              <p
                class="text-sm mt-1 whitespace-pre-wrap"
                :class="comment.status === 'resolved' ? 'text-zinc-400 line-through' : 'text-zinc-700'"
              >
                {{ comment.content }}
              </p>

              <!-- Actions -->
              <div class="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  class="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  @click="startReply(comment.id)"
                >
                  <Reply class="h-3 w-3" /> 回复
                </button>
                <button
                  v-if="comment.status === 'open'"
                  class="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                  @click="resolveComment(comment.id)"
                >
                  <Check class="h-3 w-3" /> 已解决
                </button>
                <button
                  v-if="comment.created_by === user?.id"
                  class="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  @click="deleteComment(comment.id)"
                >
                  <Trash2 class="h-3 w-3" /> 删除
                </button>
              </div>
            </div>
          </div>

          <!-- Replies -->
          <div v-if="comment.replies?.length" class="mt-3 ml-9 space-y-2 border-l-2 border-zinc-100 pl-3">
            <div v-for="reply in comment.replies" :key="reply.id" class="flex items-start gap-2">
              <div class="h-6 w-6 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                <span class="text-[10px] font-semibold text-zinc-500">{{ reply.author_name?.charAt(0) || '?' }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-medium text-zinc-700">{{ reply.author_name }}</span>
                  <span class="text-[10px] text-zinc-400">{{ formatTime(reply.created_at) }}</span>
                </div>
                <p class="text-xs text-zinc-600 mt-0.5 whitespace-pre-wrap">{{ reply.content }}</p>
              </div>
              <button
                v-if="reply.created_by === user?.id"
                class="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-300 hover:text-red-500 transition-all"
                @click="deleteComment(reply.id)"
              >
                <Trash2 class="h-3 w-3" />
              </button>
            </div>
          </div>

          <!-- Reply input -->
          <div v-if="replyingTo === comment.id" class="mt-3 ml-9 relative">
            <Textarea
              v-model="replyContent"
              rows="2"
              placeholder="写下回复..."
              class="text-xs resize-none pr-16"
              @input="(e: Event) => handleInput(e, 'reply')"
            />
            <!-- Mention dropdown -->
            <div
              v-if="showMentionDropdown && filteredMembers.length"
              class="absolute left-0 bottom-full mb-1 bg-white rounded-lg border border-zinc-200 shadow-lg z-20 w-48 max-h-32 overflow-auto"
            >
              <button
                v-for="m in filteredMembers"
                :key="m.user_id"
                class="w-full text-left px-3 py-1.5 text-xs hover:bg-indigo-50 transition-colors"
                @click="insertMention(m, 'reply')"
              >
                <span class="font-medium text-zinc-700">{{ m.user_name }}</span>
              </button>
            </div>
            <div class="absolute bottom-1.5 right-1.5 flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                class="h-6 text-[10px] text-zinc-400"
                @click="replyingTo = null"
              >
                取消
              </Button>
              <Button
                size="sm"
                class="h-6 text-[10px]"
                :disabled="sending || !replyContent.trim()"
                @click="submitReply(comment.id)"
              >
                <Send class="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-8">
      <MessageSquare class="h-8 w-8 text-zinc-300 mx-auto mb-2" />
      <p class="text-sm text-zinc-400">暂无评论</p>
      <p class="text-xs text-zinc-300 mt-0.5">写下第一条意见吧</p>
    </div>

    <!-- New comment input -->
    <div class="relative border-t border-zinc-100 pt-3">
      <Textarea
        v-model="newContent"
        rows="2"
        placeholder="写下评论... 输入 @ 提及队友"
        class="text-sm resize-none pr-12"
        @input="(e: Event) => handleInput(e, 'new')"
        @keydown.meta.enter="submitComment"
        @keydown.ctrl.enter="submitComment"
      />
      <!-- Mention dropdown -->
      <div
        v-if="showMentionDropdown && filteredMembers.length && !replyingTo"
        class="absolute left-0 bottom-full mb-1 bg-white rounded-lg border border-zinc-200 shadow-lg z-20 w-48 max-h-32 overflow-auto"
      >
        <button
          v-for="m in filteredMembers"
          :key="m.user_id"
          class="w-full text-left px-3 py-1.5 text-xs hover:bg-indigo-50 transition-colors"
          @click="insertMention(m, 'new')"
        >
          <span class="font-medium text-zinc-700">{{ m.user_name }}</span>
        </button>
      </div>
      <Button
        size="sm"
        class="absolute bottom-1.5 right-1.5 h-7 w-7 p-0"
        :disabled="sending || !newContent.trim()"
        @click="submitComment"
      >
        <Send class="h-3.5 w-3.5" />
      </Button>
    </div>
  </div>
</template>
