import { buildPjApiPayload, validatePjPayload } from './payload-builder.service'
import { updateUserPJ, individualRegister, getAppToken } from './g8.service'
import { setAppToken } from '@/utils/cronos-token'
import { db } from '@/db'
import { customers, onboardingStates } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { updateOnboardingProgress } from '@/repositories/customer-pj.repository'

/**
 * Garante que o token da aplicação está configurado
 */
async function ensureAppToken() {
  try {
    const response = await getAppToken()
    if (response.data?.token) {
      setAppToken(response.data.token)
    }
  } catch (error) {
    console.error('Erro ao obter token da aplicação', error)
    throw error
  }
}

/**
 * Inicia onboarding PJ na API externa
 * Passo 1: Envia apenas o CNPJ
 */
export async function startPjOnboarding(document: string) {
  // Garante que tem token
  await ensureAppToken()

  // Chama API externa
  const response = await individualRegister({ document })

  // Busca ou cria customer local
  let customer = await db.query.customers.findFirst({
    where: eq(customers.document, document),
  })

  if (!customer) {
    // Cria customer se não existir
    const [created] = await db
      .insert(customers)
      .values({
        document,
        tipo_conta: 'cnpj',
        individual_id: response.individual_id,
        external_status: response.status,
        onboarding_status: 'em_cadastro',
      })
      .returning()
    customer = created
  } else {
    // Atualiza customer existente
    await db
      .update(customers)
      .set({
        individual_id: response.individual_id,
        external_status: response.status,
      })
      .where(eq(customers.id, customer.id))
  }

  // Salva estado retornado
  await db.insert(onboardingStates).values({
    customer_id: customer.id,
    success: response.success,
    message: response.message,
    code: response.code,
    individual_id: response.individual_id,
    document: response.document,
    status: response.status,
    status_label: response.status_label,
    current_step: response.current_step?.toString(),
    tipo_conta: response.tipo_conta as 'cnpj',
    pending_fields: response.pending_fields,
    uploaded_files: response.uploaded_files,
  })

  // Atualiza progresso local
  await updateOnboardingProgress(customer.id, {
    pending_fields: response.pending_fields || [],
  })

  return {
    customer_id: customer.id,
    individual_id: response.individual_id,
    response,
  }
}

/**
 * Envia dados completos do PJ para API externa
 * Passo final: Envia todos os dados preenchidos
 */
export async function syncPjToExternalApi(customerId: string) {
  // Garante que tem token
  await ensureAppToken()

  // Monta payload agregado
  const payload = await buildPjApiPayload(customerId)

  // Valida antes de enviar
  const validation = validatePjPayload(payload)
  if (!validation.valid) {
    throw new Error(
      `Campos obrigatórios faltando: ${validation.missingFields.join(', ')}`,
    )
  }

  // Busca customer para pegar individual_id
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, customerId),
  })

  if (!customer || !customer.individual_id) {
    throw new Error(
      'Customer não encontrado ou onboarding não iniciado na API externa. Chame startPjOnboarding primeiro.',
    )
  }

  // Envia para API externa
  const response = await updateUserPJ(customer.individual_id, payload)

  // Salva estado retornado
  await db.insert(onboardingStates).values({
    customer_id: customerId,
    success: response.success,
    message: response.message,
    code: response.code,
    individual_id: response.individual_id,
    document: response.document,
    status: response.status,
    status_label: response.status_label,
    current_step: response.current_step?.toString(),
    tipo_conta: response.tipo_conta as 'cnpj',
    pending_fields: response.pending_fields,
    uploaded_files: response.uploaded_files,
  })

  // Atualiza progresso local com campos pendentes da API
  await updateOnboardingProgress(customerId, {
    last_sync_pending_fields: response.pending_fields,
    last_sync_at: new Date(),
  })

  // Marca como sincronizado
  await db
    .update(customers)
    .set({
      synced_at: new Date(),
      external_status: response.status,
      onboarding_status: response.success ? 'enviado' : 'erro',
    })
    .where(eq(customers.id, customerId))

  return response
}

