import { eq, and } from 'drizzle-orm'
import { db } from '../db'
import { CustomerPartner, NewCustomerPartner, socios } from '@/db/schema'


/**
 * CREATE — cadastrar sócio
 */
export async function createCustomerPartner(
  data: NewCustomerPartner,
): Promise<CustomerPartner> {
  const [partner] = await db
    .insert(socios)
    .values(data)
    .returning()

  return partner
}

/**
 * FIND — by id
 */
export async function findCustomerPartnerById(
  id: string,
): Promise<CustomerPartner | null> {
  const [partner] = await db
    .select()
    .from(socios)
    .where(eq(socios.id, id))
    .limit(1)

  return partner ?? null
}

/**
 * FIND — by customer + document
 * (evita duplicar sócio)
 */
export async function findCustomerPartnerByDocument(
  customerId: string,
  document: string,
): Promise<CustomerPartner | null> {
  const [partner] = await db
    .select()
    .from(socios)
    .where(
      and(
        eq(socios.customer_id, customerId),
        eq(socios.document, document),
      ),
    )
    .limit(1)

  return partner ?? null
}

/**
 * LIST — sócios do cliente
 */
export async function listCustomerPartners(
  customerId: string,
): Promise<CustomerPartner[]> {
  return db
    .select()
    .from(socios)
    .where(eq(socios.customer_id, customerId))
}

/**
 * UPDATE — parcial
 */
export async function updateCustomerPartner(
  id: string,
  data: Partial<NewCustomerPartner>,
): Promise<CustomerPartner | null> {
  const [partner] = await db
    .update(socios)
    .set({
      ...data,
      updated_at: new Date(),
    })
    .where(eq(socios.id, id))
    .returning()

  return partner ?? null
}

/**
 * DELETE
 */
export async function deleteCustomerPartner(
  id: string,
): Promise<boolean> {
  const result = await db
    .delete(socios)
    .where(eq(socios.id, id))

  return result.rowCount! > 0
}
