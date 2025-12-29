import { buildPjApiPayload, validatePjPayload } from './payload-builder.service'
import { updateUserPJ, individualRegister, getAppToken, http } from './g8.service'
import { setAppToken } from '@/utils/cronos-token'
import { db } from '@/db'
import { customers, onboardingStates } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { updateOnboardingProgress } from '@/repositories/customer-pj.repository'
import { findCustomerById } from '@/repositories/customer.repository'
import { CustomerNotFoundError } from '@/errors/customer-errors'
import { listCustomerPartners } from '@/repositories/customer-partners-repository'

function parseDateLike(value: unknown): Date | null {
  if (value == null) return null
  if (value instanceof Date && !isNaN(value.getTime())) return value
  if (typeof value === 'number' || typeof value === 'string') {
    const d = new Date(value as string | number)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

function describeTypes(obj: Record<string, any>) {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) out[k] = String(v)
    else if (v instanceof Date) out[k] = 'Date'
    else if (Array.isArray(v))
      out[k] = 'Array<' + (v.length ? typeof v[0] : 'unknown') + '>'
    else out[k] = v.constructor?.name ?? typeof v
  }
  return out
}

function sanitizeDatesForDb(value: any): any {
  if (value == null) return value
  if (Array.isArray(value)) return value.map(sanitizeDatesForDb)
  if (value instanceof Date) return value
  if (typeof value === 'object') {
    const out: Record<string, any> = {}
    for (const [k, v] of Object.entries(value)) {
      if (v == null) {
        out[k] = v
        continue
      }

      if (
        typeof v === 'number' ||
        (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v))
      ) {
        const parsed = parseDateLike(v)
        if (parsed) {
          out[k] = parsed
          continue
        }
      }

      const keyLooksLikeDate = /(date|_at)$/i.test(k)
      if (keyLooksLikeDate) {
        const parsed = parseDateLike(v)
        if (parsed) {
          out[k] = parsed
          continue
        }
      }

      out[k] = sanitizeDatesForDb(v)
    }
    return out
  }
  return value
}

function normalizeDatesForApi(value: any): any {
  if (value == null) return value
  if (Array.isArray(value)) return value.map(normalizeDatesForApi)
  if (typeof value === 'object') {
    const out: Record<string, any> = {}
    for (const [k, v] of Object.entries(value)) {
      if (v == null) {
        out[k] = v
        continue
      }
      const keyLooksLikeDate = /(date|_at)$/i.test(k)
      if (keyLooksLikeDate) {
        if (v instanceof Date) {
          out[k] = v.toISOString()
          continue
        }
        if (typeof v === 'string') {
          const parsed = parseDateLike(v)
          if (parsed) {
            out[k] = parsed.toISOString()
            continue
          }
        }
      }
      out[k] = normalizeDatesForApi(v)
    }
    return out
  }
  return value
}

//verifica o token

// async function ensureAppToken() {
//   try {
//     const response = await getAppToken()
//     if (response.data?.token) {
//       setAppToken(response.data.token)
//     }
//   } catch (error) {
//     console.error('Erro ao obter token da aplicação', error)
//     throw error
//   }
// }

export async function startPjOnboarding(document: string) {
  // await ensureAppToken()
  let response
  try {
    response = await individualRegister({ document })
  } catch (err: any) {
    const isConflict =
      err?.code === 'CUSTOMER_ALREADY_EXISTS' ||
      err?.statusCode === 409 ||
      err?.response?.status === 409

    if (!isConflict) throw err

    // Fallback: buscar usuário existente para continuar o onboarding
    const existing = await http.get(`/v1/register/individual/${document}`)
    response = existing.data
  }

  let customer = await db.query.customers.findFirst({
    where: eq(customers.document, document),
  })

  const onboardingStatus =
    response?.status === 'aguardando_aprovacao' ? 'completo' : 'em_cadastro'

  if (!customer) {
    const [created] = await db
      .insert(customers)
      .values({
        document,
        tipo_conta: 'cnpj',
        individual_id: response.individual_id,
        external_status: response.status,
        onboarding_status: onboardingStatus,
      })
      .returning()
    customer = created
  } else {
    await db
      .update(customers)
      .set({
        individual_id: response.individual_id,
        external_status: response.status,
        onboarding_status: onboardingStatus,
      })
      .where(eq(customers.id, customer.id))
  }

  return {
    customer_id: customer.id,
    individual_id: response.individual_id,
    response,
  }
}

export async function syncPjToExternalApi(customerId: string) {

  const payload = await buildPjApiPayload(customerId)

  const validation = validatePjPayload(payload)
  if (!validation.valid) {
    throw new Error(
      `Campos obrigatórios faltando: ${validation.missingFields.join(', ')}`,
    )
  }

  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, customerId),
  })

  if (!customer || !customer.individual_id) {
    throw new Error(
      'Customer não encontrado ou onboarding não iniciado na API externa. Chame startPjOnboarding primeiro.',
    )
  }

  const payloadForApi = normalizeDatesForApi(payload)
  const response = await updateUserPJ(customer.individual_id, payloadForApi)

  const respForDb = sanitizeDatesForDb(response)
  try {
    await db.insert(onboardingStates).values({
      customer_id: customerId,
      success: respForDb.success,
      message: respForDb.message,
      code: respForDb.code,
      individual_id: respForDb.individual_id,
      document: respForDb.document,
      status: respForDb.status,
      status_label: respForDb.status_label,
      current_step: respForDb.current_step?.toString(),
      tipo_conta: respForDb.tipo_conta as 'cnpj',
      pending_fields: respForDb.pending_fields,
      uploaded_files: respForDb.uploaded_files,
    })
  } catch (err) {
    console.error(
      'Erro ao inserir onboardingStates — tipos dos valores:',
      describeTypes({
        success: respForDb.success,
        message: respForDb.message,
        code: respForDb.code,
        individual_id: respForDb.individual_id,
        document: respForDb.document,
        status: respForDb.status,
        status_label: respForDb.status_label,
        current_step: respForDb.current_step,
        tipo_conta: respForDb.tipo_conta,
        pending_fields: respForDb.pending_fields,
        uploaded_files: respForDb.uploaded_files,
      }),
    )
    throw err
  }

  await updateOnboardingProgress(customerId, {
    last_sync_pending_fields: respForDb.pending_fields,
    last_sync_at: new Date(),
  })

  await db
    .update(customers)
    .set({
      synced_at: new Date(),
      external_status: respForDb.status,
      onboarding_status: respForDb.success ? 'enviado' : 'erro',
    })
    .where(eq(customers.id, customerId))

  return response
}

export async function listSociosPJ(customerId: string) {
  const customer = await findCustomerById(customerId)

  if (!customer) {
    throw CustomerNotFoundError()
  }

  return listCustomerPartners(customer.id)
}
