import { AssetService } from '~/core/services/asset.service'
import { StorageService } from '~/core/services/storage.service'
import { ok, badRequest } from '~/server/utils/response'

export default defineApiHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')!

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) badRequest('请上传文件')

  const fileField = formData.find((f) => f.name === 'file')
  if (!fileField || !fileField.data || !fileField.filename) badRequest('file 字段必填')

  const getField = (name: string) => formData.find((f) => f.name === name)?.data?.toString()

  const mimetype = fileField.type || 'application/octet-stream'
  const saved = await StorageService.saveFile(projectId, {
    buffer: fileField.data,
    originalFilename: fileField.filename,
    mimetype,
  })

  let assetType: 'image' | 'audio' | 'video' = 'image'
  const typeField = getField('type')
  if (typeField === 'audio' || typeField === 'video') assetType = typeField
  else if (mimetype.startsWith('audio/')) assetType = 'audio'
  else if (mimetype.startsWith('video/')) assetType = 'video'

  const asset = await AssetService.create(
    projectId,
    {
      type: assetType,
      category: getField('category') || 'general',
      file_path: saved.relativePath,
      file_name: fileField.filename,
      file_size: fileField.data.length,
      mime_type: mimetype,
      linked_entity_type: getField('linked_entity_type'),
      linked_entity_id: getField('linked_entity_id'),
    },
    userId,
  )
  return ok(asset)
})
