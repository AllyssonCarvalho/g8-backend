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

export const registerStep1Schema = z.object({
  individual_id: z.string(),
  full_name: z.string().min(1),
  username: z.string().min(1),
  email: z.string(),

  dataFundacaoEmpresa: z.string().optional().nullable(),
  cpfRepresentanteEmpresa: z.string().optional().nullable(),
  cnae: z.string().optional().nullable(),
  cnae_descricao: z.string().optional().nullable(),
  capital_social: z.string().optional().nullable(),
  razaoSocial: z.string().optional().nullable(),
  nomeFantasia: z.string().optional().nullable(),
})

export const registerStep2Schema = z.object({
  individual_id: z.string(),
  phone_prefix: z.string().min(1),
  phone_number: z.string().min(1),
  code: z.string().optional(),
})

export const registerStep3Schema = z.object({
  individual_id: z.string(),
  image_type: z.string(),
  document_type: z.string(),
})

export type RegisterStep1Data = z.infer<typeof registerStep1Schema>
export type RegisterStep2Data = z.infer<typeof registerStep2Schema>
export type RegisterStep3Data = z.infer<typeof registerStep3Schema>

export type OnboardingResponse = z.infer<typeof onboardingResponseSchema>

export type KnownPendingField = z.infer<typeof pendingFieldEnum>
export type PendingFields = KnownPendingField[]

export type UploadedFile = Record<string, unknown>
