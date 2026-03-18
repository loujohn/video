import { randomUUID } from 'crypto'
import { join, extname } from 'path'
import { mkdir, writeFile, unlink, access } from 'fs/promises'

function getStorageRoot(): string {
  return process.env.STORAGE_LOCAL_PATH || join(process.cwd(), 'uploads')
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200)
}

export const StorageService = {
  async saveFile(
    projectId: string,
    file: { buffer: Buffer; originalFilename: string; mimetype: string },
  ): Promise<{ relativePath: string; url: string }> {
    const root = getStorageRoot()
    const dir = join(root, 'projects', projectId)
    await mkdir(dir, { recursive: true })

    const ext = extname(file.originalFilename) || ''
    const safeName = `${randomUUID()}${ext}`
    const fullPath = join(dir, safeName)
    await writeFile(fullPath, file.buffer)

    const relativePath = `projects/${projectId}/${safeName}`
    return {
      relativePath,
      url: `/uploads/${relativePath}`,
    }
  },

  async deleteFile(relativePath: string): Promise<void> {
    const root = getStorageRoot()
    const fullPath = join(root, relativePath)
    try {
      await access(fullPath)
      await unlink(fullPath)
    } catch {
      // file already gone — ignore
    }
  },
}
