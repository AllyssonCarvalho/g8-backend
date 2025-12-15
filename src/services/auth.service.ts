// src/services/auth.service.ts
import { individualRegister } from '@/cronos'
import { RegisterSimplifySchema } from '@/schemas/cronos/onboardig-response.schema'

export async function registerSimplify(
  individualId: string,
  payload: RegisterSimplifySchema,
) {
  const response = await individualRegister(payload)
  return response
}
