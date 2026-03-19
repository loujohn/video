import { api } from '../lib/api-client.js'

export const commentTools = [
  {
    name: 'list_comments',
    description: '查看某实体（剧本/分镜/角色/场景/道具/创作方案）的评论',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        entity_type: {
          type: 'string',
          enum: ['episode_script', 'storyboard', 'character', 'scene', 'prop', 'creative_plan'],
          description: '实体类型',
        },
        entity_id: { type: 'string', description: '实体 ID' },
      },
      required: ['project_id', 'entity_type', 'entity_id'],
    },
  },
  {
    name: 'add_comment',
    description: '对实体添加评论',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        entity_type: {
          type: 'string',
          enum: ['episode_script', 'storyboard', 'character', 'scene', 'prop', 'creative_plan'],
          description: '实体类型',
        },
        entity_id: { type: 'string', description: '实体 ID' },
        content: { type: 'string', description: '评论内容' },
        parent_id: { type: 'string', description: '回复的父评论 ID（可选）' },
      },
      required: ['project_id', 'entity_type', 'entity_id', 'content'],
    },
  },
  {
    name: 'resolve_comment',
    description: '将评论标记为已解决',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: '项目 ID' },
        comment_id: { type: 'string', description: '评论 ID' },
      },
      required: ['project_id', 'comment_id'],
    },
  },
]

export async function handleCommentTool(name: string, args: Record<string, unknown>): Promise<string> {
  const pid = args.project_id as string

  switch (name) {
    case 'list_comments': {
      const entityType = args.entity_type as string
      const entityId = args.entity_id as string
      const params = new URLSearchParams({ entity_type: entityType, entity_id: entityId })
      return JSON.stringify(
        await api.get(`/api/projects/${pid}/comments?${params.toString()}`),
        null,
        2,
      )
    }

    case 'add_comment': {
      return JSON.stringify(
        await api.post(`/api/projects/${pid}/comments`, {
          entity_type: args.entity_type,
          entity_id: args.entity_id,
          content: args.content,
          parent_id: args.parent_id || undefined,
        }),
        null,
        2,
      )
    }

    case 'resolve_comment': {
      const commentId = args.comment_id as string
      return JSON.stringify(
        await api.put(`/api/projects/${pid}/comments/${commentId}`, { status: 'resolved' }),
        null,
        2,
      )
    }

    default:
      throw new Error(`Unknown comment tool: ${name}`)
  }
}
