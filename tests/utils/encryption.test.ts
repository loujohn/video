import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('#imports', () => ({
  useRuntimeConfig: () => ({
    agentEncryptionKey: 'test-encryption-key-32bytes-long!',
  }),
}))

describe('encryption', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('encrypts and decrypts a string correctly', async () => {
    const { encrypt, decrypt } = await import('../../server/utils/encryption')
    const original = 'sk-my-secret-api-key-12345'
    const encrypted = encrypt(original)

    expect(encrypted).not.toBe(original)
    expect(typeof encrypted).toBe('string')

    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(original)
  })

  it('produces different ciphertexts for same plaintext (random IV)', async () => {
    const { encrypt } = await import('../../server/utils/encryption')
    const original = 'same-key-same-key'
    const enc1 = encrypt(original)
    const enc2 = encrypt(original)

    expect(enc1).not.toBe(enc2)
  })

  it('fails to decrypt with tampered ciphertext', async () => {
    const { encrypt, decrypt } = await import('../../server/utils/encryption')
    const encrypted = encrypt('test-value')
    const tampered = encrypted.slice(0, -4) + 'XXXX'

    expect(() => decrypt(tampered)).toThrow()
  })

  it('handles empty string encryption', async () => {
    const { encrypt, decrypt } = await import('../../server/utils/encryption')
    const encrypted = encrypt('')
    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe('')
  })

  it('handles unicode content', async () => {
    const { encrypt, decrypt } = await import('../../server/utils/encryption')
    const original = '中文API密钥🔑'
    const encrypted = encrypt(original)
    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(original)
  })

  describe('maskApiKey', () => {
    it('masks a standard API key', async () => {
      const { maskApiKey } = await import('../../server/utils/encryption')
      expect(maskApiKey('sk-abcdefg12345678')).toBe('sk-a...5678')
    })

    it('returns **** for short keys', async () => {
      const { maskApiKey } = await import('../../server/utils/encryption')
      expect(maskApiKey('short')).toBe('****')
      expect(maskApiKey('12345678')).toBe('****')
    })

    it('masks a 9-char key', async () => {
      const { maskApiKey } = await import('../../server/utils/encryption')
      expect(maskApiKey('123456789')).toBe('1234...6789')
    })
  })
})
