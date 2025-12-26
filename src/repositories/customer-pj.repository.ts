import { db } from '@/db'
import {
  customerDocuments,
  customerPjData,
  customers,
  onboardingProgress,
  socioDocuments,
  socios,
} from '@/db/schema'
import { http } from '@/libs/http-client'
import console from 'console'
import { and, eq, sql } from 'drizzle-orm'
import FormData from 'form-data'

export type CustomerPjAggregate = {
  customer: typeof customers.$inferSelect
  pjData: typeof customerPjData.$inferSelect | null
  socios: (typeof socios.$inferSelect & {
    documents: (typeof socioDocuments.$inferSelect)[]
  })[]
  documents: (typeof customerDocuments.$inferSelect)[]
  progress: {
    filled_fields: string[]
    pending_fields: string[]
  } | null
}

export async function getCustomerPjById(
  customerId: string,
): Promise<CustomerPjAggregate | null> {
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, customerId),
  })

  if (!customer || customer.tipo_conta !== 'cnpj') {
    return null
  }

  const pjData = await db.query.customerPjData.findFirst({
    where: eq(customerPjData.customer_id, customerId),
  })

  const sociosList = await db.query.socios.findMany({
    where: eq(socios.customer_id, customerId),
  })

  const sociosWithDocuments = await Promise.all(
    sociosList.map(async (socio) => {
      const documents = await db.query.socioDocuments.findMany({
        where: eq(socioDocuments.socio_id, socio.id),
      })
      return { ...socio, documents }
    }),
  )

  const customerDocs = await db.query.customerDocuments.findMany({
    where: eq(customerDocuments.customer_id, customerId),
  })

  const progress = await db.query.onboardingProgress.findFirst({
    where: eq(onboardingProgress.customer_id, customerId),
  })

  return {
    customer,
    pjData: pjData ?? null,
    socios: sociosWithDocuments,
    documents: customerDocs,
    progress: progress
      ? {
          filled_fields: progress.filled_fields || [],
          pending_fields: progress.pending_fields || [],
        }
      : null,
  }
}

export async function getCustomerPjByDocument(
  document: string,
): Promise<CustomerPjAggregate | null> {
  const customer = await db.query.customers.findFirst({
    where: and(
      eq(customers.document, document),
      eq(customers.tipo_conta, 'cnpj'),
    ),
  })

  if (!customer) {
    return null
  }

  return getCustomerPjById(customer.id)
}

export async function upsertCustomerPjData(
  customerId: string,
  data: Partial<
    Omit<
      typeof customerPjData.$inferInsert,
      'id' | 'customer_id' | 'created_at' | 'updated_at'
    >
  >,
) {
  const cleanData: Record<string, any> = {}

  if (data.razao_social !== undefined)
    cleanData.razao_social = String(data.razao_social)
  if (data.nome_fantasia !== undefined)
    cleanData.nome_fantasia = String(data.nome_fantasia)
  if (data.foundation_date !== undefined)
    cleanData.foundation_date = String(data.foundation_date)
  if (data.cnae !== undefined) cleanData.cnae = String(data.cnae)
  if (data.cnae_description !== undefined)
    cleanData.cnae_description = String(data.cnae_description)
  if (data.capital_social !== undefined)
    cleanData.capital_social = String(data.capital_social)

  const existing = await db.query.customerPjData.findFirst({
    where: eq(customerPjData.customer_id, customerId),
  })

  if (existing) {
    const [updated] = await db
      .update(customerPjData)
      .set(cleanData)
      .where(eq(customerPjData.customer_id, customerId))
      .returning()

    await db.execute(
      sql`UPDATE customer_pj_data SET updated_at = now() WHERE customer_id = ${customerId}`,
    )

    return updated
  }

  const [created] = await db
    .insert(customerPjData)
    .values({
      customer_id: customerId,
      ...cleanData,
    })
    .returning()
  return created
}

export async function upsertSocioWithDocuments(
  customerId: string,
  socioData: any,
  documents: {
    document_type: string
    file_base64: string
    file_name: string
    file_size: number
    mime_type: string
  }[],
) {
  try {
    // ==========================
    // 1. UPSERT SOCIO (BANCO)
    // ==========================
    const existing = await db.query.socios.findFirst({
      where: and(
        eq(socios.customer_id, customerId),
        eq(socios.document, socioData.document),
      ),
    })

    let socio: any

    if (existing) {
      const [updated] = await db
        .update(socios)
        .set(socioData)
        .where(eq(socios.id, existing.id))
        .returning()

      socio = updated
    } else {
      const [created] = await db
        .insert(socios)
        .values({
          customer_id: customerId,
          ...socioData,
        })
        .returning()

      socio = created
    }

    // ==========================
    // 2. SALVAR DOCUMENTOS (BANCO)
    // ==========================
    if (documents.length) {
      const docsToInsert = documents.map((doc) => ({
        socio_id: socio.id,
        document_type: doc.document_type,
        file_base64: doc.file_base64,
        file_name: doc.file_name,
        file_size: doc.file_size,
        mime_type: doc.mime_type,
        uploaded_to_exter: false,
      }))

      await db.insert(socioDocuments).values(docsToInsert)
    }

    // ==========================
    // 3. MONTAR FORMDATA (API EXTERNA)
    // ==========================
    const formData = new FormData()

    // 👉 campos texto (tudo que veio no form-data original)
    for (const [key, value] of Object.entries(socioData)) {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value))
      }
    }

    // 👉 arquivos
    for (const doc of documents) {
      const buffer = Buffer.from(doc.file_base64, 'base64')

      formData.append(doc.document_type, buffer, {
        filename: doc.file_name,
        contentType: doc.mime_type,
        knownLength: doc.file_size,
      })
    }

    // ==========================
    // 4. CHAMADA EXTERNA
    // ==========================
      const response = await http.post(
        '/v1/register/individual/step3',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        },
      )

      return {
        socio,
        external_response: response.data,
      }

  } catch (error) {
    console.error(
      'Erro ao upsertar sócio com documentos',
      JSON.stringify(error, null, 2),
    )
    throw new Error('Erro ao upsertar sócio')
  }
}

export async function addCustomerDocument(
  customerId: string,
  documentData: {
    document_type: string
    file_base64: string
    file_name?: string
    file_size?: number
    mime_type?: string
  },
) {
  await db
    .delete(customerDocuments)
    .where(
      and(
        eq(customerDocuments.customer_id, customerId),
        eq(customerDocuments.document_type, documentData.document_type),
      ),
    )

  const [created] = await db
    .insert(customerDocuments)
    .values({
      customer_id: customerId,
      ...documentData,
    })
    .returning()
  return created
}

export async function addSocioDocument(
  socioId: string,
  documentData: {
    document_type: string
    file_base64: string
    file_name?: string
    file_size?: number
    mime_type?: string
  },
) {
  await db
    .delete(socioDocuments)
    .where(
      and(
        eq(socioDocuments.socio_id, socioId),
        eq(socioDocuments.document_type, documentData.document_type),
      ),
    )

  const [created] = await db
    .insert(socioDocuments)
    .values({
      socio_id: socioId,
      ...documentData,
    })
    .returning()
  return created
}

export async function updateOnboardingProgress(
  customerId: string,
  progress: {
    filled_fields?: string[]
    pending_fields?: string[]
    last_sync_pending_fields?: string[]
    last_sync_at?: Date | string | null
  },
) {
  const existing = await db.query.onboardingProgress.findFirst({
    where: eq(onboardingProgress.customer_id, customerId),
  })

  const lastSyncAt =
    progress.last_sync_at == null
      ? undefined
      : progress.last_sync_at instanceof Date
        ? progress.last_sync_at
        : new Date(progress.last_sync_at)

  if (existing) {
    const [updated] = await db
      .update(onboardingProgress)
      .set({
        filled_fields: progress.filled_fields ?? existing.filled_fields,
        pending_fields: progress.pending_fields ?? existing.pending_fields,
        last_sync_pending_fields:
          progress.last_sync_pending_fields ??
          existing.last_sync_pending_fields,
        last_sync_at: lastSyncAt ?? existing.last_sync_at,
      })
      .where(eq(onboardingProgress.customer_id, customerId))
      .returning()

    return updated
  }

  const [created] = await db
    .insert(onboardingProgress)
    .values({
      customer_id: customerId,
      filled_fields: progress.filled_fields ?? [],
      pending_fields: progress.pending_fields ?? [],
      last_sync_pending_fields: progress.last_sync_pending_fields,
      last_sync_at: lastSyncAt,
    })
    .returning()

  return created
}
