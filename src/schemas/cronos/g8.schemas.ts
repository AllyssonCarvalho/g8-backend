import { z } from 'zod'

export const knownPendingFields = [
  'full_name',
  'name',
  'razao_social',
  'email',
  'phone_number',
  'code',
  'foto_selfie',
  'document_name',
  'mother_name',
  'gender',
  'birth_date',
  'marital_status',
  'nationality',
  'nationality_state',
  'document_number',
  'document_state',
  'issuance_date',
  'document_issuance',
  'pep',
  'postal_code',
  'number',
  'street',
  'city',
  'neighborhood',
  'state',
  'country',
  'data_fundacao_empresa',
  'cnae',
  'cnae_descricao',
  'capital_social',
  'socios',
  'contrato_social',
  'cartao_cnpj',
  'password',
] as const

export const pendingFieldEnum = z.enum(knownPendingFields)

export const onboardingResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  code: z.number(),
  individual_id: z.string().optional(),
  document: z.string(),
  status: z.string(),
  status_label: z.string().optional(),
  current_step: z.union([z.number(), z.string()]).optional(),
  tipo_conta: z.string(),
  pending_fields: z.array(z.union([pendingFieldEnum, z.string()])).optional(),
  uploaded_files: z.array(z.any()).optional(),
})

export type OnboardingResponse = z.infer<typeof onboardingResponseSchema>

export type KnownPendingField = z.infer<typeof pendingFieldEnum>
export type PendingFields = KnownPendingField[]

export type UploadedFile = Record<string, unknown>
