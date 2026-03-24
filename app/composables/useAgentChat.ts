export interface ToolCallInfo {
  id: string
  name: string
  args: Record<string, unknown>
  result?: string
  status: 'running' | 'done' | 'error'
}

export interface AgentMessage {
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
  const conversationId = ref<string | null>(null)

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
          conversation_id: conversationId.value,
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
      let textContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const jsonStr = line.slice(6)
          try {
            const event = JSON.parse(jsonStr)
            handleStreamEvent(event, textContent, (t) => { textContent = t })
          }
          catch { /* ignore malformed SSE */ }
        }
      }

      if (buffer.startsWith('data: ')) {
        try {
          const event = JSON.parse(buffer.slice(6))
          handleStreamEvent(event, textContent, (t) => { textContent = t })
        }
        catch { /* ignore */ }
      }

      messages.value.push({
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: textContent,
        toolCalls: [...streamingToolCalls.value],
        timestamp: Date.now(),
      })
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

  function handleStreamEvent(
    event: { type: string; [key: string]: unknown },
    textContent: string,
    setTextContent: (t: string) => void,
  ) {
    switch (event.type) {
      case 'conversation': {
        conversationId.value = event.conversationId as string
        break
      }
      case 'text': {
        const newText = textContent + (event.text as string)
        setTextContent(newText)
        streamingContent.value = newText
        break
      }
      case 'tool-call': {
        const tc: ToolCallInfo = {
          id: event.toolCallId as string,
          name: event.toolName as string,
          args: (event.args as Record<string, unknown>) || {},
          status: 'running',
        }
        streamingToolCalls.value = [...streamingToolCalls.value, tc]
        break
      }
      case 'tool-result': {
        const callId = event.toolCallId as string
        streamingToolCalls.value = streamingToolCalls.value.map(tc =>
          tc.id === callId
            ? { ...tc, result: event.result as string, status: 'done' as const }
            : tc,
        )
        break
      }
      case 'error': {
        error.value = event.message as string
        break
      }
    }
  }

  async function loadConversation(convId: string) {
    try {
      const res = await fetch(`/api/agent/conversations/${convId}`, {
        headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
      })
      if (!res.ok) return
      const json = await res.json()
      const conv = json.data

      conversationId.value = convId
      projectId.value = conv.project_id || null
      skillId.value = conv.skill_id || 'drama-writer'

      messages.value = (conv.messages || []).map((m: any, i: number) => ({
        id: m.id || `msg-${i}`,
        role: m.role,
        content: m.content,
        toolCalls: m.tool_calls || [],
        timestamp: new Date(m.created_at).getTime(),
      }))
    }
    catch {
      error.value = '加载对话失败'
    }
  }

  function clearMessages() {
    messages.value = []
    conversationId.value = null
  }

  return {
    messages,
    isStreaming,
    streamingContent,
    streamingToolCalls,
    projectId,
    skillId,
    error,
    conversationId,
    sendMessage,
    clearMessages,
    loadConversation,
  }
}
