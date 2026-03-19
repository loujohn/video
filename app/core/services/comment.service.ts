import { CommentModel } from '../models/comment.model'
import { NotificationModel } from '../models/notification.model'
import { ProjectService } from './project.service'
import { TeamModel } from '../models/team.model'
import { EpisodeModel } from '../models/episode.model'
import { StoryboardModel } from '../models/storyboard.model'
import { notFoundError, forbiddenError, badRequestError } from '../errors'
import { getDb } from '../db'
import type { Comment, CommentWithAuthor, CreateCommentInput, UpdateCommentInput, CommentEntityType, CreateNotificationInput } from '../types'

const ENTITY_TYPE_LABELS: Record<CommentEntityType, string> = {
  episode_script: '剧本',
  storyboard: '分镜',
  character: '角色',
  scene: '场景',
  prop: '道具',
  creative_plan: '创作方案',
}

export const CommentService = {
  async list(projectId: string, entityType: CommentEntityType, entityId: string, userId: string): Promise<CommentWithAuthor[]> {
    await ProjectService.getProject(projectId, userId)
    const flat = await CommentModel.findByEntity(projectId, entityType, entityId)
    return buildCommentTree(flat)
  },

  async create(projectId: string, input: CreateCommentInput, userId: string): Promise<Comment> {
    const project = await ProjectService.getProject(projectId, userId)
    if (!input.content?.trim()) badRequestError('评论内容不能为空')

    const comment = await CommentModel.create(projectId, input, userId)

    // Fire-and-forget notification
    generateNotifications(project.team_id, projectId, comment, input, userId).catch(() => {})

    return comment
  },

  async update(projectId: string, commentId: string, data: UpdateCommentInput, userId: string): Promise<Comment> {
    await ProjectService.getProject(projectId, userId)
    const comment = await CommentModel.findById(commentId)
    if (!comment || comment.project_id !== projectId) notFoundError('评论不存在')

    if (data.content !== undefined && comment.created_by !== userId) {
      forbiddenError('只能编辑自己的评论')
    }

    const updated = await CommentModel.update(commentId, data)
    if (!updated) notFoundError('更新失败')

    if (data.status === 'resolved' && comment.status !== 'resolved') {
      notifyStatusChange(projectId, comment, userId).catch(() => {})
    }

    return updated
  },

  async delete(projectId: string, commentId: string, userId: string): Promise<void> {
    await ProjectService.getProject(projectId, userId)
    const comment = await CommentModel.findById(commentId)
    if (!comment || comment.project_id !== projectId) notFoundError('评论不存在')
    if (comment.created_by !== userId) forbiddenError('只能删除自己的评论')
    await CommentModel.delete(commentId)
  },

  async countByEntity(projectId: string, entityType: CommentEntityType, entityId: string): Promise<number> {
    return CommentModel.countByEntity(projectId, entityType, entityId)
  },

  async countByEntities(projectId: string, entityType: CommentEntityType, entityIds: string[]): Promise<Record<string, number>> {
    return CommentModel.countByEntities(projectId, entityType, entityIds)
  },
}

export function buildCommentTree(flat: CommentWithAuthor[]): CommentWithAuthor[] {
  const map = new Map<string, CommentWithAuthor>()
  const roots: CommentWithAuthor[] = []
  for (const c of flat) {
    c.replies = []
    map.set(c.id, c)
  }
  for (const c of flat) {
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.replies!.push(c)
    } else {
      roots.push(c)
    }
  }
  return roots
}

async function getActorName(userId: string): Promise<string> {
  const user = await getDb()('users').where({ id: userId }).select('name').first()
  return user?.name || '未知用户'
}

async function buildEntityLink(projectId: string, entityType: CommentEntityType, entityId: string): Promise<string> {
  switch (entityType) {
    case 'episode_script': {
      const ep = await EpisodeModel.findById(entityId)
      return ep ? `/projects/${projectId}/episodes/${ep.episode_number}/script` : `/projects/${projectId}/episodes`
    }
    case 'storyboard': {
      const sb = await StoryboardModel.findById(entityId)
      if (sb) {
        const ep = await getDb()('episodes').where({ id: sb.episode_id }).first()
        if (ep) return `/projects/${projectId}/episodes/${ep.episode_number}/storyboards`
      }
      return `/projects/${projectId}/episodes`
    }
    case 'character':
      return `/projects/${projectId}/characters`
    case 'scene':
    case 'prop':
      return `/projects/${projectId}/scenes`
    case 'creative_plan':
      return `/projects/${projectId}/plan`
    default:
      return `/projects/${projectId}`
  }
}

async function generateNotifications(
  teamId: string,
  projectId: string,
  comment: Comment,
  input: CreateCommentInput,
  userId: string,
): Promise<void> {
  const actorName = await getActorName(userId)
  const entityLabel = ENTITY_TYPE_LABELS[input.entity_type] || input.entity_type
  const link = await buildEntityLink(projectId, input.entity_type, input.entity_id)
  const mentionSet = new Set(input.mentions || [])
  const notifications: CreateNotificationInput[] = []

  // Reply notification
  if (input.parent_id) {
    const parent = await CommentModel.findById(input.parent_id)
    if (parent && parent.created_by !== userId && !mentionSet.has(parent.created_by)) {
      notifications.push({
        user_id: parent.created_by,
        type: 'reply',
        title: `${actorName} 回复了你的评论`,
        content: truncate(comment.content, 100),
        link,
        related_entity_type: input.entity_type,
        related_entity_id: input.entity_id,
        created_by: userId,
      })
    }
  }

  // Mention notifications
  for (const mentionedUserId of mentionSet) {
    if (mentionedUserId === userId) continue
    notifications.push({
      user_id: mentionedUserId,
      type: 'mention',
      title: `${actorName} 在${entityLabel}中提及了你`,
      content: truncate(comment.content, 100),
      link,
      related_entity_type: input.entity_type,
      related_entity_id: input.entity_id,
      created_by: userId,
    })
  }

  // General comment notification to other team members
  const members = await TeamModel.getMembers(teamId)
  const notifiedUserIds = new Set([userId, ...mentionSet])
  if (input.parent_id) {
    const parent = await CommentModel.findById(input.parent_id)
    if (parent) notifiedUserIds.add(parent.created_by)
  }

  for (const member of members) {
    if (notifiedUserIds.has(member.user_id)) continue
    notifications.push({
      user_id: member.user_id,
      type: 'comment',
      title: `${actorName} 在${entityLabel}中发表了评论`,
      content: truncate(comment.content, 100),
      link,
      related_entity_type: input.entity_type,
      related_entity_id: input.entity_id,
      created_by: userId,
    })
  }

  if (notifications.length) {
    await NotificationModel.createBatch(notifications)
  }
}

async function notifyStatusChange(projectId: string, comment: Comment, resolvedByUserId: string): Promise<void> {
  if (comment.created_by === resolvedByUserId) return
  const actorName = await getActorName(resolvedByUserId)
  const entityLabel = ENTITY_TYPE_LABELS[comment.entity_type as CommentEntityType] || comment.entity_type
  const link = await buildEntityLink(projectId, comment.entity_type as CommentEntityType, comment.entity_id)

  await NotificationModel.create({
    user_id: comment.created_by,
    type: 'status_change',
    title: `${actorName} 将你在${entityLabel}的评论标记为已解决`,
    content: truncate(comment.content, 100),
    link,
    related_entity_type: comment.entity_type,
    related_entity_id: comment.entity_id,
    created_by: resolvedByUserId,
  })
}

export function truncate(text: string, maxLen: number): string {
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text
}
