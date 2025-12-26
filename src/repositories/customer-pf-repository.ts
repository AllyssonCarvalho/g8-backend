import { eq } from 'drizzle-orm'
import { db } from '../db'
import { CustomerPf, customerPfData, NewCustomerPf } from '@/db/schema'


/**
 * CREATE — cadastro PF
 * (1 PF por customer)
 */
export async function createCustomerPf(
  data: NewCustomerPf,
): Promise<CustomerPf> {
  const [pf] = await db
    .insert(customerPfData)
    .values(data)
    .returning()

  return pf
}

/**
 * FIND — by customer_id
 */
export async function findCustomerPfByCustomerId(
  customerId: string,
): Promise<CustomerPf | null> {
  const [pf] = await db
    .select()
    .from(customerPfData)
    .where(eq(customerPfData.customer_id, customerId))
    .limit(1)

  return pf ?? null
}

/**
 * FIND — by id
 */
export async function findCustomerPfById(
  id: string,
): Promise<CustomerPf | null> {
  const [pf] = await db
    .select()
    .from(customerPfData)
    .where(eq(customerPfData.id, id))
    .limit(1)

  return pf ?? null
}

/**
 * UPSERT — cria ou atualiza PF
 * (muito útil no onboarding step-by-step)
 */
export async function upsertCustomerPf(
  customerId: string,
  data: Omit<NewCustomerPf, 'customer_id'>,
): Promise<CustomerPf> {
  const existing = await findCustomerPfByCustomerId(customerId)

  if (existing) {
    const [updated] = await db
      .update(customerPfData)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(customerPfData.customer_id, customerId))
      .returning()

    return updated
  }

  const [created] = await db
    .insert(customerPfData)
    .values({
      customer_id: customerId,
      ...data,
    })
    .returning()

  return created
}

/**
 * UPDATE — parcial
 */
export async function updateCustomerPf(
  customerId: string,
  data: Partial<NewCustomerPf>,
): Promise<CustomerPf | null> {
  const [pf] = await db
    .update(customerPfData)
    .set({
      ...data,
      updated_at: new Date(),
    })
    .where(eq(customerPfData.customer_id, customerId))
    .returning()

  return pf ?? null
}

/**
 * DELETE
 */
export async function deleteCustomerPf(
  customerId: string,
): Promise<boolean> {
  const result = await db
    .delete(customerPfData)
    .where(eq(customerPfData.customer_id, customerId))

  return result.rowCount! > 0
}
