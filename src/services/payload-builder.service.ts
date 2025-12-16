import { getCustomerPjById } from '@/repositories/customer-pj.repository'
import type { CustomerPjAggregate } from '@/repositories/customer-pj.repository'

/**
 * Tipo do payload esperado pela API externa para PJ
 */
export type PjApiPayload = {
  name?: string
  email?: string
  foundation_date?: string
  cnae?: string
  cnae_description?: string
  capital_social?: number
  nome_fantasia?: string
  phone?: string
  comprovante_endereco?: string
  contrato_social?: string
  cartao_cnpj?: string
  street?: string
  number?: string
  postal_code?: string
  neighborhood?: string
  state?: string
  city?: string
  country?: string
  complement?: string
  password?: string
  socios?: Array<{
    document: string
    document_name?: string
    document_number?: string
    rg_frente?: string
    rg_verso?: string
    cnh_frente?: string
    cnh_verso?: string
    rne_frente?: string
    rne_verso?: string
    selfie?: string
    comprovante_endereco?: string
    percentual_participacao?: number
    mother_name?: string
    father_name?: string
    pep?: number
    document_issuance?: string
    document_state?: string
    issuance_date?: string
    nationality?: string
    nationality_state?: string
    marital_status?: number
    birth_date?: string
    gender?: string
    name?: string
    majority?: boolean
  }>
}

/**
 * Agrega todos os dados do customer PJ e monta payload para API externa
 */
export async function buildPjApiPayload(
  customerId: string,
): Promise<PjApiPayload> {
  const aggregate = await getCustomerPjById(customerId)

  if (!aggregate) {
    throw new Error(`Customer PJ não encontrado: ${customerId}`)
  }

  const { customer, pjData, socios, documents } = aggregate

  const payload: PjApiPayload = {}

  // Dados básicos da empresa
  if (pjData?.razao_social) payload.name = pjData.razao_social
  if (customer.email) payload.email = customer.email
  if (customer.phone_number) payload.phone = customer.phone_number
  if (pjData?.nome_fantasia) payload.nome_fantasia = pjData.nome_fantasia
  if (pjData?.foundation_date) payload.foundation_date = pjData.foundation_date
  if (pjData?.cnae) payload.cnae = pjData.cnae
  if (pjData?.cnae_description) payload.cnae_description = pjData.cnae_description
  if (pjData?.capital_social) {
    payload.capital_social = Number(pjData.capital_social)
  }

  // Endereço
  if (customer.street) payload.street = customer.street
  if (customer.number) payload.number = customer.number
  if (customer.postal_code) payload.postal_code = customer.postal_code
  if (customer.neighborhood) payload.neighborhood = customer.neighborhood
  if (customer.state) payload.state = customer.state
  if (customer.city) payload.city = customer.city
  if (customer.country) payload.country = customer.country
  if (customer.complement) payload.complement = customer.complement

  // Documentos da empresa
  const contratoSocial = documents.find(
    (doc) => doc.document_type === 'contrato_social',
  )
  if (contratoSocial) {
    payload.contrato_social = contratoSocial.file_base64
  }

  const cartaoCnpj = documents.find(
    (doc) => doc.document_type === 'cartao_cnpj',
  )
  if (cartaoCnpj) {
    payload.cartao_cnpj = cartaoCnpj.file_base64
  }

  const comprovanteEndereco = documents.find(
    (doc) => doc.document_type === 'comprovante_endereco',
  )
  if (comprovanteEndereco) {
    payload.comprovante_endereco = comprovanteEndereco.file_base64
  }

  // Sócios
  if (socios.length > 0) {
    payload.socios = socios.map((socio) => {
      const socioPayload: PjApiPayload['socios']![0] = {
        document: socio.document,
      }

      // Dados básicos do sócio
      if (socio.name) socioPayload.name = socio.name
      if (socio.document_name) socioPayload.document_name = socio.document_name
      if (socio.document_number) {
        socioPayload.document_number = socio.document_number
      }
      if (socio.mother_name) socioPayload.mother_name = socio.mother_name
      if (socio.father_name) socioPayload.father_name = socio.father_name
      if (socio.pep !== null && socio.pep !== undefined) {
        socioPayload.pep = socio.pep
      }
      if (socio.document_issuance) {
        socioPayload.document_issuance = socio.document_issuance
      }
      if (socio.document_state) {
        socioPayload.document_state = socio.document_state
      }
      if (socio.issuance_date) {
        socioPayload.issuance_date = socio.issuance_date
      }
      if (socio.nationality) socioPayload.nationality = socio.nationality
      if (socio.nationality_state) {
        socioPayload.nationality_state = socio.nationality_state
      }
      if (socio.marital_status !== null && socio.marital_status !== undefined) {
        socioPayload.marital_status = socio.marital_status
      }
      if (socio.birth_date) socioPayload.birth_date = socio.birth_date
      if (socio.gender) socioPayload.gender = socio.gender
      if (socio.percentual_participacao) {
        socioPayload.percentual_participacao = Number(
          socio.percentual_participacao,
        )
      }
      if (socio.majority !== null && socio.majority !== undefined) {
        socioPayload.majority = socio.majority
      }

      // Documentos do sócio
      socio.documents.forEach((doc) => {
        const apiField = doc.document_type
        if (apiField && doc.file_base64) {
          ;(socioPayload as any)[apiField] = doc.file_base64
        }
      })

      return socioPayload
    })
  }

  return payload
}

/**
 * Valida se todos os campos obrigatórios estão preenchidos
 */
export function validatePjPayload(payload: PjApiPayload): {
  valid: boolean
  missingFields: string[]
} {
  const missingFields: string[] = []

  // Campos obrigatórios básicos
  if (!payload.name) missingFields.push('name')
  if (!payload.email) missingFields.push('email')
  if (!payload.phone) missingFields.push('phone')
  if (!payload.foundation_date) missingFields.push('foundation_date')
  if (!payload.cnae) missingFields.push('cnae')

  // Endereço obrigatório
  if (!payload.street) missingFields.push('street')
  if (!payload.number) missingFields.push('number')
  if (!payload.postal_code) missingFields.push('postal_code')
  if (!payload.neighborhood) missingFields.push('neighborhood')
  if (!payload.city) missingFields.push('city')
  if (!payload.state) missingFields.push('state')
  if (!payload.country) missingFields.push('country')

  // Documentos obrigatórios
  if (!payload.contrato_social) missingFields.push('contrato_social')
  if (!payload.cartao_cnpj) missingFields.push('cartao_cnpj')

  // Sócios obrigatórios
  if (!payload.socios || payload.socios.length === 0) {
    missingFields.push('socios')
  } else {
    // Valida cada sócio
    payload.socios.forEach((socio, index) => {
      if (!socio.document) {
        missingFields.push(`socios[${index}].document`)
      }
      if (!socio.name) {
        missingFields.push(`socios[${index}].name`)
      }
    })
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
  }
}

