import { CustomerNotFoundError } from '@/errors/customer-errors'
import { http } from '@/libs/http-client'
import { createCustomerDocument } from '@/repositories/customer-documents-repository'
import { updateCustomerPf } from '@/repositories/customer-pf-repository'
import {
  findCustomerByIndividualId,
  updateCustomer,
} from '@/repositories/customer.repository'
import {
  RegisterStep1PJData,
  RegisterStep2Data,
  RegisterStep3Data,
  RegisterStep3PJData,
  RegisterStep4Data,
  RegisterStep5Data,
  RegisterStep6Data,
  RegisterStep7Data,
} from '@/schemas/cronos/g8.schemas'
import bcrypt from 'bcrypt'

type RegisterStep3Input = RegisterStep3Data & {
  fileBase64?: string
  fileMimeType?: string
  fileName?: string
}

type RegisterStep5Input = RegisterStep5Data & {
  fileBase64: string
  fileMimeType: string
  fileName: string
}
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
    if (!data.individual_id) {
      throw CustomerNotFoundError()
    }

    const customer = await findCustomerByIndividualId(data.individual_id)

    if (!customer) {
      throw CustomerNotFoundError()
    }

    const updatedCustomer = await updateCustomer(customer.id, {
      phone_number: `${data.phone_prefix}${data.phone_number}`,
      current_step: 2,
      updated_at: new Date(),
    })

    const response = await http.post('/v1/register/individual/step2', data)
    return { data: response.data, updatedCustomer }
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

function base64ToBlob(base64: string, mimeType: string) {
  const buffer = Buffer.from(base64, 'base64')
  return new Blob([buffer], { type: mimeType })
}

export const registerStep3 = async (data: RegisterStep3Input) => {
  try {
    const formData = new FormData()

    const fileBlob = base64ToBlob(data.fileBase64!, data.fileMimeType!)

    formData.append('individual_id', data.individual_id)
    formData.append('image_type', data.image_type)
    formData.append('document_type', data.document_type)
    formData.append('file', fileBlob, data.fileName)

    const customer = await findCustomerByIndividualId(data.individual_id)

    if (!customer) {
      throw CustomerNotFoundError()
    }

    const updatedCustomer = await updateCustomer(customer.id, {
      current_step: 4,
      updated_at: new Date(),
    })

    await createCustomerDocument({
      customer_id: customer.id,
      document_type: data.document_type,
      file_base64: data.fileBase64!,
      file_name: data.fileName!,
      mime_type: data.fileMimeType!,
    })

    const response = await http.post(
      '/v1/register/individual/step3',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )

    return { data: response.data, updatedCustomer }
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

export const registerStep4 = async (data: RegisterStep4Data) => {
  try {
    const customer = await findCustomerByIndividualId(data.individual_id)

    if (!customer) {
      throw CustomerNotFoundError()
    }

    const pfUser = await updateCustomerPf(customer.id, {
      customer_id: customer.id,
      ...data,
    })

    const updatedUser = await updateCustomer(customer.id, {
      current_step: 5,
      updated_at: new Date(),
    })

    const response = await http.post('/v1/register/individual/step4', data)
    return { data: response.data, user: { pfUser, updatedUser } }
  } catch (error) {
    console.error('Erro ao registrar step 4', error)
    throw error
  }
}

export const registerStep5 = async (data: RegisterStep5Input) => {
  try {
    const formData = new FormData()

    const fileBlob = base64ToBlob(data.fileBase64, data.fileMimeType)

    formData.append('individual_id', data.individual_id)
    formData.append('image_type', data.image_type)
    formData.append('file', fileBlob, data.fileName)

    const customer = await findCustomerByIndividualId(data.individual_id)

    if (!customer) {
      throw CustomerNotFoundError()
    }

    const updatedCustomer = await updateCustomer(customer.id, {
      current_step: 6,
      updated_at: new Date(),
    })

    await createCustomerDocument({
      customer_id: customer.id,
      document_type: 'selfie',
      file_base64: data.fileBase64,
      file_name: data.fileName,
      mime_type: data.fileMimeType,
    })

    const response = await http.post(
      '/v1/register/individual/step5',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )

    return { data: response.data, updatedCustomer }
  } catch (error) {
    console.error('Erro ao registrar step 5', error)
    throw error
  }
}

export const registerStep6 = async (data: RegisterStep6Data) => {
  try {
    const customer = await findCustomerByIndividualId(data.individual_id)

    if (!customer) {
      throw CustomerNotFoundError()
    }

    const updatedUser = await updateCustomer(customer.id, {
      current_step: 7,
      updated_at: new Date(),
      ...data,
    })

    const response = await http.post('/v1/register/individual/step6', data)
    return { data: response.data, updatedUser }
  } catch (error) {
    console.error('Erro ao registrar step 6', error)
    throw error
  }
}

export const registerStep7 = async (data: RegisterStep7Data) => {
  try {
  
    const customer = await findCustomerByIndividualId(data.individual_id)


    if (!customer) {
      throw CustomerNotFoundError()
    }

    const password_hash = await bcrypt.hash(data.password, 10)

    const updatedUser = await updateCustomer(customer.id, {
      current_step: 8,
      updated_at: new Date(),
      password_hash,
      onboarding_status: 'completo',
      ...data,
    })

    const response = await http.post('/v1/register/individual/step7', data)
    return { data: response.data, updatedUser }
  } catch (error) {
    console.error('Erro ao registrar step 7', error)
    throw error
  }
}


export const registerStep1PJ = async (customerId: string, data: RegisterStep1PJData) => {
  try {
    const response = await http.post('/v1/register/individual/step1', data)

       const updatedUser = await updateCustomer(customerId, {
      current_step: 2,
      updated_at: new Date(),
    })

    return response.data
  } catch (error) {
    console.error('Erro ao registrar step 1 PJ', error)
    throw error
  }
}


export const registerStep3PJ = async (customerId: string, data: any) => {
  try {
    const response = await http.post(
      '/v1/register/individual/step3',
      data,
      {
        headers: {
          ...data.getHeaders(), // 🔑 OBRIGATÓRIO
        },
      },
    )


    const updatedUser = await updateCustomer(customerId, {
      current_step: 4,
      updated_at: new Date(),
    })


    return response.data
  } catch (error) {
    console.error('Erro ao registrar step 3 PJ', error)
    throw error
  }
}

export const registerStep4PJ = async (customerId: string, data: any) => {
  try {
    const response = await http.post(
      '/v1/register/individual/step4',
      data,
      {
        headers: {
          ...data.getHeaders(), // 🔑 OBRIGATÓRIO
        },
      },
    )


    await updateCustomer(customerId, {
      current_step: 5,
      updated_at: new Date(),
    })


    return response.data
  } catch (error) {
    console.error('Erro ao registrar step 4 PJ', error)
    throw error
  }
}

export const registerStep5PJ = async (customerId: string, data: any) => {
  try {
    const response = await http.post('/v1/register/individual/step5', data)

       const updatedUser = await updateCustomer(customerId, {
      current_step: 6,
      updated_at: new Date(),
      ...data
    })

    return { data: response.data, updatedUser }
  } catch (error) {
    console.error('Erro ao registrar step 5 PJ', error)
    throw error
  }
}

