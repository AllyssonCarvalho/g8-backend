import { http } from '@/libs/http-client'
import {
  RegisterStep2Data,
  RegisterStep3Data,
} from '@/schemas/cronos/g8.schemas'
import { getAppTokenValue } from '@/utils/cronos-token'

export const getUserOnboardingSituation = async (document: string) => {
  try {
    const response = await http.get(`/v1/individual/${document}`)
    return response.data
  } catch (error) {
    console.error('Erro ao obter situação do usuário', error)
    throw error
  }
}

export const registerStep2 = async (data: RegisterStep2Data) => {
  try {
    const response = await http.post('/v1/register/individual/step2', data)
    console.log('RESPOSTA DO SMS', getAppTokenValue())
    return response.data
  } catch (error) {
    console.error('Erro ao registrar step 2', error)
    throw error
  }
}

export const registerStep2_1 = async (data: RegisterStep2Data) => {
  try {
    const response = await http.put('/v1/register/individual/step2', data)
    console.log('RESPOSTA DO SMS', response)
    return response.data
  } catch (error) {
    console.error('Erro ao registrar step 2', error)
    throw error
  }
}

export const individualRegister = async (data: { document: string }) => {
  try {
    const response = await http.post('/v1/register/individual', data)
    return response.data
  } catch (error) {
    console.error('Erro ao registrar indivíduo', error)
    throw error
  }
}

export const resendCode = async (individual_id: string) => {
  try {
    const response = await http.post(`/v1/register/individual/resendsmscode`, {
      individual_id,
    })
    return response.data
  } catch (error) {
    console.error('Erro ao reenviar código', error)
    throw error
  }
}
export const consultaCep = async (cep: string) => {
  try {
    const response = await http.get(`/v1/register/consultcep/${cep}`)
    return response
  } catch (error) {
    console.error('Erro ao consultar cep', error)
    throw error
  }
}

export const registerStep3 = async (
  data: RegisterStep3Data & { file: File | Blob },
) => {
  try {
    const formData = new FormData()

    formData.append('individual_id', data.individual_id)
    formData.append('image_type', data.image_type)
    formData.append('document_type', data.document_type)
    formData.append('file', data.file)

    const response = await http.post(
      '/v1/register/individual/step3',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )

    return response.data
  } catch (error) {
    console.error('Erro ao registrar step 3', error)
    throw error
  }
}

export const registerStepStep3_1 = async (individual_id: string) => {
  try {
    const response = await http.get(
      `/v1/register/individual/step3/${individual_id}`,
    )
    return response.data
  } catch (error) {
    console.error('Erro ao obter lista de socios', error)
    throw error
  }
}

export const registerStepStep3_2 = async (
  individual_id: string,
  id_socio: string,
) => {
  try {
    const response = await http.put(
      `/v1/register/individual/step3/${individual_id}`,
      null,
      {
        params: {
          id_socio,
        },
      },
    )

    return response.data
  } catch (error) {
    console.error('Erro ao registrar step 3.2', error)
    throw error
  }
}

export const deletarSocio = async (individual_id: string, id_socio: string) => {
  try {
    const response = await http.delete(
      `/v1/register/individual/step3/${individual_id}/${id_socio}`,
    )
    return response.data
  } catch (error) {
    console.error('Erro ao excluir usuario', error)
    throw error
  }
}
