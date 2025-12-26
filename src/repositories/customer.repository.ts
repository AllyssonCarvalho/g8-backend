import { eq } from 'drizzle-orm'
import { db } from '../db'
import { Customer, customers, NewCustomer } from '@/db/schema'

/**
 * CREATE
 */
export async function createCustomer(
  data: NewCustomer,
): Promise<Customer> {
  const [customer] = await db
    .insert(customers)
    .values(data)
    .returning()

  return customer
}

/**
 * READ — by id
 */
export async function findCustomerById(
  id: string,
): Promise<Customer | null> {
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1)

  return customer ?? null
}

export async function findCustomerByIndividualId(
  id: string,
): Promise<Customer | null> {
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.individual_id, id))
    .limit(1)

  return customer ?? null
}

/**
 * READ — by document
 */
export async function findCustomerByDocument(
  document: string,
): Promise<Customer | null> {
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.document, document))
    .limit(1)

  return customer ?? null
}

/**
 * LIST
 */
export async function listCustomers(): Promise<Customer[]> {
  return db.select().from(customers)
}

/**
 * UPDATE (parcial)
 */
export async function updateCustomer(
  id: string,
  data: Partial<NewCustomer>,
): Promise<Customer | null> {
  const [customer] = await db
    .update(customers)
    .set({
      ...data,
      updated_at: new Date(),
    })
    .where(eq(customers.id, id))
    .returning()

  return customer ?? null
}

/**
 * DELETE
 */
export async function deleteCustomer(id: string): Promise<boolean> {
  const result = await db
    .delete(customers)
    .where(eq(customers.id, id))

  return result.rowCount! > 0
}