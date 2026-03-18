export class AppError extends Error {
  statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
  }
}

export function notFoundError(message: string): never {
  throw new AppError(404, message)
}

export function forbiddenError(message: string): never {
  throw new AppError(403, message)
}

export function badRequestError(message: string): never {
  throw new AppError(400, message)
}
