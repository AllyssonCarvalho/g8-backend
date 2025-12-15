import { http } from '@/lib/http-client'
import {
  onboardingResponseSchema,
  type OnboardingResponse,
} from '@/schemas/cronos/onboardig-response.schema'
import { updateSimplifyResponseSchema, type UpdateSimplifyResponse } from '@/schemas/cronos/update-simplify-response.schema'

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
  data: unknown,
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

export const simplifyRegister = async (
  individualId: string,
  data: unknown,
): Promise<UpdateSimplifyResponse> => {
  try {
    const response = await http.post(`/v1/register/simplify/${individualId}`, data)
    const parsed = updateSimplifyResponseSchema.parse(response.data)
    return parsed
  } catch (error) {
    console.error('Erro ao atualizar cadastro simplificado', error)
    throw error
  }
}

export const updateUserPF = async (
  individualId: string,
  data: unknown,
): Promise<UpdateSimplifyResponse> => {
  return simplifyRegister(individualId, data)
}

export const updateUserPJ = async (
  individualId: string,
  data: unknown,
): Promise<UpdateSimplifyResponse> => {
  return simplifyRegister(individualId, data)
}

// NOTE: updateUserPF and updateUserPJ weren't used and conflicted with simplify endpoint;
// Keep simplifyRegister for POST behavior and remove unused duplicated PUT helpers if needed.
