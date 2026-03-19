import { CommentService } from '~/core/services/comment.service'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!
  const body = await readBody(event)
  if (!body.entity_type || !body.entity_id || !body.content) {
    badRequest('entity_type, entity_id, content 必填')
  }
  return ok(await CommentService.create(projectId, body, userId))
})
