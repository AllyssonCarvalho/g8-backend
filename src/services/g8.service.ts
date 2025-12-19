
import { OnboardingResponse, onboardingResponseSchema } from '@/schemas/cronos/g8.schemas'

import { http } from '../libs/http-client'
import * as httpClientModule from '../libs/http-client'

console.log('[g8.service] http-client module =', httpClientModule)

export const getAppToken = async () => {
  console.log('URL =', http.defaults)
  try {
    const response = await http.get('/v1/application/token')
    console.log("Response =", response.data)
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

export const individualRegister = async (
  data: { document: string },
): Promise<OnboardingResponse> => {
  try {
    const response = await http.post('/v1/register/individual', {
      document: data.document,
    })
    const parsed = onboardingResponseSchema.parse(response.data)
    return parsed
  } catch (error) {
    console.error('Erro ao cadastrar individual', error)
    throw error
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


export const individualRegisterStep1 = async (
  data: unknown,
): Promise<OnboardingResponse> => {
  try {
    const response = await http.post('/v1/register/individual/step1', data)
    const parsed = onboardingResponseSchema.parse(response.data)
    return parsed
  } catch (error) {
    console.error('Erro no step1 do registro individual', error)
    throw error
  }
}