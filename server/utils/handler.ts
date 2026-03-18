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
      throw error
    }
  })
}
