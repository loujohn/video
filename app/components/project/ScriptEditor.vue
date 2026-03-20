<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Highlight from '@tiptap/extension-highlight'
import { Markdown } from 'tiptap-markdown'
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo2,
  Redo2,
  Highlighter,
  RemoveFormatting,
  Code,
} from 'lucide-vue-next'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'save': []
}>()

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    Placeholder.configure({
      placeholder: props.placeholder || '在此编写剧本内容...',
    }),
    CharacterCount,
    Highlight,
    Markdown.configure({
      html: false,
      transformPastedText: true,
      transformCopiedText: true,
    }),
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-sm prose-zinc max-w-none focus:outline-none min-h-[400px] px-5 py-4',
    },
    handleKeyDown(_view, event) {
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault()
        emit('save')
        return true
      }
      return false
    },
  },
  onUpdate({ editor: e }) {
    emit('update:modelValue', e.storage.markdown.getMarkdown())
  },
})

watch(() => props.modelValue, (val) => {
  if (!editor.value) return
  const current = editor.value.storage.markdown.getMarkdown()
  if (current !== val) {
    editor.value.commands.setContent(val)
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

const characterCount = computed(() => editor.value?.storage.characterCount.characters() ?? 0)

defineExpose({ characterCount })

interface ToolbarItem {
  icon: any
  title: string
  action: () => void
  isActive?: () => boolean
}

const toolbarGroups = computed<ToolbarItem[][]>(() => {
  if (!editor.value) return []
  const e = editor.value
  return [
    [
      { icon: Bold, title: '粗体', action: () => e.chain().focus().toggleBold().run(), isActive: () => e.isActive('bold') },
      { icon: Italic, title: '斜体', action: () => e.chain().focus().toggleItalic().run(), isActive: () => e.isActive('italic') },
      { icon: Strikethrough, title: '删除线', action: () => e.chain().focus().toggleStrike().run(), isActive: () => e.isActive('strike') },
      { icon: Highlighter, title: '高亮', action: () => e.chain().focus().toggleHighlight().run(), isActive: () => e.isActive('highlight') },
      { icon: Code, title: '行内代码', action: () => e.chain().focus().toggleCode().run(), isActive: () => e.isActive('code') },
    ],
    [
      { icon: Heading1, title: '标题1', action: () => e.chain().focus().toggleHeading({ level: 1 }).run(), isActive: () => e.isActive('heading', { level: 1 }) },
      { icon: Heading2, title: '标题2', action: () => e.chain().focus().toggleHeading({ level: 2 }).run(), isActive: () => e.isActive('heading', { level: 2 }) },
      { icon: Heading3, title: '标题3', action: () => e.chain().focus().toggleHeading({ level: 3 }).run(), isActive: () => e.isActive('heading', { level: 3 }) },
    ],
    [
      { icon: List, title: '无序列表', action: () => e.chain().focus().toggleBulletList().run(), isActive: () => e.isActive('bulletList') },
      { icon: ListOrdered, title: '有序列表', action: () => e.chain().focus().toggleOrderedList().run(), isActive: () => e.isActive('orderedList') },
      { icon: Quote, title: '引用', action: () => e.chain().focus().toggleBlockquote().run(), isActive: () => e.isActive('blockquote') },
      { icon: Minus, title: '分割线', action: () => e.chain().focus().setHorizontalRule().run() },
    ],
    [
      { icon: Undo2, title: '撤销', action: () => e.chain().focus().undo().run() },
      { icon: Redo2, title: '重做', action: () => e.chain().focus().redo().run() },
      { icon: RemoveFormatting, title: '清除格式', action: () => e.chain().focus().clearNodes().unsetAllMarks().run() },
    ],
  ]
})
</script>

<template>
  <div class="script-editor border border-zinc-200/60 rounded-xl overflow-hidden bg-white">
    <div v-if="editor" class="flex items-center gap-0.5 px-3 py-2 border-b border-zinc-100 bg-zinc-50/50 flex-wrap">
      <template v-for="(group, gi) in toolbarGroups" :key="gi">
        <div v-if="gi > 0" class="w-px h-5 bg-zinc-200 mx-1" />
        <button
          v-for="item in group"
          :key="item.title"
          type="button"
          :title="item.title"
          :class="[
            'h-7 w-7 rounded flex items-center justify-center transition-colors',
            item.isActive?.() ? 'bg-indigo-100 text-indigo-700' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700',
          ]"
          @click="item.action"
        >
          <component :is="item.icon" class="h-3.5 w-3.5" />
        </button>
      </template>
      <div class="flex-1" />
      <span class="text-[10px] text-zinc-400 px-2">Markdown</span>
    </div>
    <EditorContent :editor="editor" class="script-editor-content" />
  </div>
</template>

<style>
.script-editor-content .tiptap {
  min-height: 400px;
  padding: 1.25rem;
  outline: none;
}
.script-editor-content .tiptap p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #a1a1aa;
  pointer-events: none;
  height: 0;
}
.script-editor-content .tiptap h1 { font-size: 1.5rem; font-weight: 700; margin: 1rem 0 0.5rem; }
.script-editor-content .tiptap h2 { font-size: 1.25rem; font-weight: 600; margin: 0.75rem 0 0.5rem; }
.script-editor-content .tiptap h3 { font-size: 1.1rem; font-weight: 600; margin: 0.5rem 0 0.25rem; }
.script-editor-content .tiptap p { margin: 0.25rem 0; line-height: 1.7; }
.script-editor-content .tiptap ul,
.script-editor-content .tiptap ol { padding-left: 1.5rem; margin: 0.5rem 0; }
.script-editor-content .tiptap li { margin: 0.15rem 0; }
.script-editor-content .tiptap ul { list-style-type: disc; }
.script-editor-content .tiptap ol { list-style-type: decimal; }
.script-editor-content .tiptap blockquote {
  border-left: 3px solid #e4e4e7;
  padding-left: 1rem;
  margin: 0.5rem 0;
  color: #71717a;
}
.script-editor-content .tiptap hr {
  border: none;
  border-top: 1px solid #e4e4e7;
  margin: 1rem 0;
}
.script-editor-content .tiptap mark {
  background-color: #fef08a;
  border-radius: 2px;
  padding: 0 2px;
}
.script-editor-content .tiptap code {
  background-color: #f4f4f5;
  border-radius: 3px;
  padding: 0.15rem 0.3rem;
  font-size: 0.9em;
}
</style>
