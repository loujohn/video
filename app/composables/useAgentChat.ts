interface ToolCallInfo {
  id: string
  name: string
  args: Record<string, unknown>
  result?: string
  status: 'running' | 'done' | 'error'
}

interface AgentMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolCalls: ToolCallInfo[]
  timestamp: number
}

export function useAgentChat() {
  const messages = ref<AgentMessage[]>([])
  const isStreaming = ref(false)
  const streamingContent = ref('')
  const streamingToolCalls = ref<ToolCallInfo[]>([])
  const projectId = ref<string | null>(null)
  const skillId = ref('drama-writer')
  const error = ref<string | null>(null)

  const token = useCookie('token')

  function buildHistory(): Array<{ role: 'user' | 'assistant'; content: string }> {
    return messages.value.map(m => ({
      role: m.role,
      content: m.content,
    }))
  }

  async function sendMessage(text: string) {
    if (!text.trim() || isStreaming.value) return

    const userMsg: AgentMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      toolCalls: [],
      timestamp: Date.now(),
    }
    messages.value.push(userMsg)

    isStreaming.value = true
    streamingContent.value = ''
    streamingToolCalls.value = []
    error.value = null

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
        },
        body: JSON.stringify({
          message: text,
          project_id: projectId.value,
          skill_id: skillId.value,
          history: buildHistory().slice(0, -1),
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        let errMsg = `请求失败 (${res.status})`
        try {
          const errJson = JSON.parse(errText)
          errMsg = errJson.message || errJson.statusMessage || errMsg
        }
        catch { /* ignore */ }
        error.value = errMsg
        isStreaming.value = false
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        error.value = '无法读取响应流'
        isStreaming.value = false
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        streamingContent.value = buffer
      }

      const errorMatch = buffer.match(/\n\n\[错误\]\s*(.+)$/)
      if (errorMatch) {
        const cleanContent = buffer.replace(/\n\n\[错误\]\s*.+$/, '').trim()
        error.value = errorMatch[1]
        if (cleanContent) {
          messages.value.push({
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: cleanContent,
            toolCalls: [...streamingToolCalls.value],
            timestamp: Date.now(),
          })
        }
      }
      else {
        messages.value.push({
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: buffer,
          toolCalls: [...streamingToolCalls.value],
          timestamp: Date.now(),
        })
      }
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '网络错误'
    }
    finally {
      isStreaming.value = false
      streamingContent.value = ''
      streamingToolCalls.value = []
    }
  }

  function clearMessages() {
    messages.value = []
  }

  return {
    messages,
    isStreaming,
    streamingContent,
    streamingToolCalls,
    projectId,
    skillId,
    error,
    sendMessage,
    clearMessages,
  }
}
