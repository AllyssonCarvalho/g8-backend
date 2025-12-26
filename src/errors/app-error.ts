export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly details?: unknown

  constructor(params: {
    message: string
    code: string
    statusCode?: number
    details?: unknown
  }) {
    super(params.message)

    this.code = params.code
    this.statusCode = params.statusCode ?? 400
    this.details = params.details
  }
}