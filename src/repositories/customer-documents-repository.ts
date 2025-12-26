import {
  CustomerDocument,
  customerDocuments,
  NewCustomerDocument,
} from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { db } from '../db'

/**
 * CREATE (upload inicial)
 */
export async function createCustomerDocument(
  data: NewCustomerDocument,
): Promise<CustomerDocument> {
  const [document] = await db.insert(customerDocuments).values(data).returning()

  return document
}

/**
 * FIND — by id
 */
export async function findCustomerDocumentById(
  id: string,
): Promise<CustomerDocument | null> {
  const [document] = await db
    .select()
    .from(customerDocuments)
    .where(eq(customerDocuments.id, id))
    .limit(1)

  return document ?? null
}

/**
 * LIST — by customer
 */
export async function listCustomerDocumentsByCustomerId(
  customerId: string,
): Promise<CustomerDocument[]> {
  return db
    .select()
    .from(customerDocuments)
    .where(eq(customerDocuments.customer_id, customerId))
}

/**
 * FIND — by customer + type
 * (ex: RG, CPF, SELFIE, COMPROVANTE)
 */
export async function findCustomerDocumentByType(
  customerId: string,
  documentType: string,
): Promise<CustomerDocument | null> {
  const [document] = await db
    .select()
    .from(customerDocuments)
    .where(
      and(
        eq(customerDocuments.customer_id, customerId),
        eq(customerDocuments.document_type, documentType),
      ),
    )
    .limit(1)

  return document ?? null
}

/**
 * UPDATE — marcar como enviado para externo
 */
export async function markDocumentAsUploaded(
  id: string,
): Promise<CustomerDocument | null> {
  const [document] = await db
    .update(customerDocuments)
    .set({
      uploaded_to_external: true,
      external_uploaded_at: new Date(),
      updated_at: new Date(),
    })
    .where(eq(customerDocuments.id, id))
    .returning()

  return document ?? null
}

/**
 * UPDATE — atualizar arquivo (reupload)
 */
export async function updateCustomerDocumentFile(
  id: string,
  data: Pick<
    NewCustomerDocument,
    'file_base64' | 'file_name' | 'file_size' | 'mime_type'
  >,
): Promise<CustomerDocument | null> {
  const [document] = await db
    .update(customerDocuments)
    .set({
      ...data,
      uploaded_to_external: false,
      external_uploaded_at: null,
      updated_at: new Date(),
    })
    .where(eq(customerDocuments.id, id))
    .returning()

  return document ?? null
}

/**
 * DELETE
 */
export async function deleteCustomerDocument(id: string): Promise<boolean> {
  const result = await db
    .delete(customerDocuments)
    .where(eq(customerDocuments.id, id))

  return result.rowCount! > 0
}
