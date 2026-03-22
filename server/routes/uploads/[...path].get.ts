import { join } from 'path'
import { readFile, access } from 'fs/promises'
import { lookup } from '~~/server/utils/mime'

export default defineEventHandler(async (event) => {
  const pathParam = getRouterParam(event, 'path')
  if (!pathParam) {
    throw createError({ statusCode: 400, message: 'Missing path' })
  }

  if (pathParam.includes('..')) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const storageRoot = process.env.STORAGE_LOCAL_PATH || join(process.cwd(), 'uploads')
  const filePath = join(storageRoot, pathParam)

  if (!filePath.startsWith(storageRoot)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  try {
    await access(filePath)
  } catch {
    throw createError({ statusCode: 404, message: 'File not found' })
  }

  const buffer = await readFile(filePath)
  const contentType = lookup(filePath)

  setResponseHeaders(event, {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Content-Length': String(buffer.length),
  })

  return buffer
})
