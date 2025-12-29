import { CustomerAlreadyExistsError, CustomerNotFoundError } from '@/errors/customer-errors'
import { IndividualRegisterFailedError } from '@/errors/onboarding-error'
import {
  findCustomerByDocument,
  findCustomerByIndividualId,
  updateCustomer,
} from '@/repositories/customer.repository'
import {
  OnboardingResponse,
  onboardingResponseSchema,
  RegisterStep1Data,
} from '@/schemas/cronos/g8.schemas'
import * as httpClientModule from '../libs/http-client'
import { http } from '../libs/http-client'
import { upsertCustomerPf } from '@/repositories/customer-pf-repository'

console.log('[g8.service] http-client module =', httpClientModule)

export const getAppToken = async () => {
  console.log('URL =', http.defaults)
  try {
    const response = await http.get('/v1/application/token')
    console.log('Response =', response.data)
    return response
  } catch (error) {
    console.error('Erro ao chamar API externa', error)
    throw error
  }
}

export const authCustomerToken = async (pub: string, secret: string) => {
  try {
    const response = await http.post('/v1/user/authtoken', {
      pub: pub,
      secret: secret,
    })
    return response
  } catch (error) {
    console.error('Erro ao autenticar customer', error)
    throw error
  }
}

export const individualRegister = async (data: {
  document: string
}): Promise<OnboardingResponse> => {
  const customerExist = await findCustomerByDocument(data.document)

  if (customerExist) {
    throw CustomerAlreadyExistsError()
  }

  try {
    const response = await http.post('/v1/register/individual', {
      document: data.document,
    })

    return onboardingResponseSchema.parse(response.data)
  } catch (error) {
    console.error('Erro ao cadastrar individual', error)

    throw IndividualRegisterFailedError(error)
  }
}

export const updateUserPF = async (
  individualId: string,
  data: unknown,
): Promise<OnboardingResponse> => {
  try {
    const response = await http.post(
      `/v1/register/simplify/${individualId}`,
      data,
    )
    const parsed = onboardingResponseSchema.parse(response.data)
    return parsed
  } catch (error) {
    console.error('Erro ao atualizar usuário PF', error)
    throw error
  }
}

export const updateUserPJ = async (
  individualId: string,
  data: unknown,
): Promise<OnboardingResponse> => {
  try {
    const response = await http.post(
      `v1/register/simplify/${individualId}`,
      data,
    )
    const parsed = onboardingResponseSchema.parse(response.data)
    return parsed
  } catch (error) {
    console.error('Erro ao atualizar usuário PJ', error)
    throw error
  }
}

// reexport http for internal consumers
export { http }

export const individualRegisterStep1 = async (data: RegisterStep1Data) => {
  try {
    const customer = await findCustomerByIndividualId(data.individual_id)

    if (!customer) {
      throw CustomerNotFoundError()
    }
    const updatedCustomer = await updateCustomer(customer!.id, {
      ...data,
      current_step: 2,
      updated_at: new Date(),
    })

    await upsertCustomerPf(customer.id, {
      ...data,
      name: data.full_name,
      full_name: data.full_name,
    })

    const response = await http.post('/v1/register/individual/step1', data)
    const parsed = onboardingResponseSchema.parse(response.data)

    return { parsed, updatedCustomer }
  } catch (error) {
    console.error('Erro no step1 do registro individual', error)
    throw error
  }
}
