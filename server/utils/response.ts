export function ok<T>(data: T) {
  return { success: true, data }
}

export function paginated<T>(data: T[], total: number, page: number, pageSize: number) {
  return {
    success: true,
    data,
    pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  }
}

export function unauthorized(message = '未授权'): never {
  throw createError({ statusCode: 401, statusMessage: message })
}

export function forbidden(message = '无权限'): never {
  throw createError({ statusCode: 403, statusMessage: message })
}

export function notFound(message = '未找到'): never {
  throw createError({ statusCode: 404, statusMessage: message })
}

export function badRequest(message = '请求参数错误'): never {
  throw createError({ statusCode: 400, statusMessage: message })
}
