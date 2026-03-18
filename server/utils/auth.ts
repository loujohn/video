import { SignJWT, jwtVerify } from 'jose'
import type { H3Event } from 'h3'

function getJwtSecret(): Uint8Array {
  const secret = useRuntimeConfig().jwtSecret || 'dev-secret'
  return new TextEncoder().encode(secret)
}

export async function signToken(payload: { userId: string }): Promise<string> {
  const config = useRuntimeConfig()
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(config.jwtExpiresIn || '7d')
    .setIssuedAt()
    .sign(getJwtSecret())
}

export async function verifyToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    return payload as unknown as { userId: string }
  } catch {
    return null
  }
}

export function getTokenFromEvent(event: H3Event): string | null {
  const auth = getHeader(event, 'authorization')
  if (auth?.startsWith('Bearer ')) {
    return auth.slice(7)
  }
  return getCookie(event, 'token') || null
}
