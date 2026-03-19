import { randomUUID } from 'crypto'
import { join, extname } from 'path'
import { mkdir, writeFile, unlink, access } from 'fs/promises'

function getStorageRoot(): string {
  return process.env.STORAGE_LOCAL_PATH || join(process.cwd(), 'uploads')
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
    if (relativePath.includes('..') || !relativePath.startsWith('projects/')) return
    const root = getStorageRoot()
    const fullPath = join(root, relativePath)
    if (!fullPath.startsWith(root)) return
    try {
      await access(fullPath)
      await unlink(fullPath)
    } catch {
      console.warn(`Failed to delete file: ${relativePath}`)
    }
  },
}
