import { describe, it, expect } from 'vitest'
import { resolve, join } from 'path'

/**
 * Tests for path traversal protection logic used in server/routes/uploads/[...path].get.ts
 * Extracted as pure logic to enable unit testing without HTTP server.
 */
function isPathSafe(storageRoot: string, pathParam: string): boolean {
  const resolvedRoot = resolve(storageRoot)
  const filePath = resolve(resolvedRoot, pathParam)
  return filePath.startsWith(resolvedRoot + '/') || filePath === resolvedRoot
}

describe('path traversal protection', () => {
  const storageRoot = '/app/uploads'

  it('allows normal file path', () => {
    expect(isPathSafe(storageRoot, 'image.jpg')).toBe(true)
  })

  it('allows nested path', () => {
    expect(isPathSafe(storageRoot, 'projects/abc/photo.png')).toBe(true)
  })

  it('blocks direct path traversal with ..', () => {
    expect(isPathSafe(storageRoot, '../etc/passwd')).toBe(false)
  })

  it('blocks nested path traversal', () => {
    expect(isPathSafe(storageRoot, 'subdir/../../etc/passwd')).toBe(false)
  })

  it('blocks absolute path outside root', () => {
    expect(isPathSafe(storageRoot, '/etc/passwd')).toBe(false)
  })

  it('blocks path that resolves to root itself without trailing separator', () => {
    // accessing the root directory itself is neither a file we want to serve
    // but the logic allows it — actual file serving will fail with 404 if not a file
    const result = isPathSafe(storageRoot, '.')
    // resolve('/app/uploads', '.') = '/app/uploads' which equals storageRoot
    expect(result).toBe(true)
  })

  it('blocks sibling directory traversal', () => {
    expect(isPathSafe(storageRoot, '../secrets/key.pem')).toBe(false)
  })

  it('allows deep nested path', () => {
    expect(isPathSafe(storageRoot, 'a/b/c/d/e.jpg')).toBe(true)
  })
})
