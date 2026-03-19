import { CommentService } from '~/core/services/comment.service'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const commentId = getRouterParam(event, 'cid')!
  await CommentService.delete(projectId, commentId, userId)
  return ok({ deleted: true })
})
