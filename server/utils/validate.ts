import type { ZodType } from 'zod/v4'
import type { H3Event } from 'h3'

export async function validateBody<T>(event: H3Event, schema: ZodType<T>): Promise<T> {
  const body = await readBody(event)
  const result = schema.safeParse(body)
  if (!result.success) {
    const messages = result.error.issues
      .map((i: any) => `${i.path.join('.')}: ${i.message}`)
      .join('; ')
    throw createError({ statusCode: 400, message: messages })
  }
  return result.data
}
