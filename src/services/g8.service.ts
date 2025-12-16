
import { OnboardingResponse, onboardingResponseSchema } from '@/schemas/cronos/g8.schemas'
import { http } from '../libs/http-client'

export const getAppToken = async () => {
  try {
    const response = await http.get('/v1/application/token')
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
    const response = await http.post('/v1/register/individual', data)
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
      `v1/register/simplify/${individualId}`,
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
