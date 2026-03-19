import { AppError } from '~/core/errors'
import type { H3Event } from 'h3'

export function defineApiHandler(fn: (event: H3Event) => Promise<any>) {
  return defineEventHandler(async (event) => {
    try {
      return await fn(event)
    } catch (error) {
      if (error instanceof AppError) {
        throw createError({ statusCode: error.statusCode, statusMessage: error.message })
      }
      if ((error as any)?.statusCode) {
        throw error
      }
      const isProd = process.env.NODE_ENV === 'production'
      if (!isProd) {
        console.error('[API Error]', error)
      }
      throw createError({
        statusCode: 500,
        statusMessage: isProd ? '服务器内部错误' : (error as Error)?.message || '未知错误',
      })
    }
  })
}
