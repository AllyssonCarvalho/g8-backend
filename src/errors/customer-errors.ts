import { AppError } from './app-error'

export const CustomerAlreadyExistsError = () =>
  new AppError({
    message: 'Já existe um cliente cadastrado com este documento',
    code: 'CUSTOMER_ALREADY_EXISTS',
    statusCode: 409,
  })

  export const CustomerNotFoundError = () =>
  new AppError({
    message: 'Cliente não encontrado',
    code: 'CUSTOMER_NOT_FOUND',
    statusCode: 404,
  })