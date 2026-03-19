import { CommentService } from '~/core/services/comment.service'

const VALID_STATUSES = ['open', 'resolved']

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const commentId = getRouterParam(event, 'cid')!
  const body = await readBody(event)
  const updateData: Record<string, unknown> = {}
  if (body.content !== undefined) updateData.content = String(body.content)
  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) badRequest('status 必须为 open 或 resolved')
    updateData.status = body.status
  }
  return ok(await CommentService.update(projectId, commentId, updateData, userId))
})
