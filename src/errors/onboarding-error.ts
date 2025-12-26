import { AppError } from './app-error'

export const IndividualRegisterFailedError = (details?: unknown) =>
  new AppError({
    message: 'Não foi possível realizar o cadastro do cliente',
    code: 'INDIVIDUAL_REGISTER_FAILED',
    statusCode: 502,
    details,
  })
