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

export const registerSimplifySchema = z.object({
  name: z.string().min(2).max(150).optional(),
  email: z.string().email().min(2).max(150).optional(),
  phone: z.string().min(2).max(30).optional(),

  rg_frente: z.string().optional(),
  rg_verso: z.string().optional(),
  cnh_frente: z.string().optional(),
  cnh_verso: z.string().optional(),
  rne_frente: z.string().optional(),
  rne_verso: z.string().optional(),

  mother_name: z.string().min(2).max(150).optional(),
  father_name: z.string().min(2).max(150).optional(),

  // Domínio 1.1 - Sexo (exemplo comum)
  gender: z.enum(['M', 'F']).optional(),

  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado YYYY-MM-DD')
    .optional(),

  nationality: z.string().min(2).max(150).optional(),
  nationality_state: z.string().min(2).max(5).optional(),

  // Domínio 1.0 - Tipo documento (ex: CPF, RG, CNH)
  document_name: z.string().min(2).max(3).optional(),
  document_number: z.string().min(2).max(40).optional(),
  document_state: z.string().min(2).max(5).optional(),

  issuance_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado YYYY-MM-DD')
    .optional(),

  document_issuance: z.string().min(2).max(40).optional(),

  // Domínio 1.2 - Estado civil
  marital_status: z.number().int().optional(),
  
  // Pessoa politicamente exposta: 1 = Sim | 0 = Não
  pep: z.union([z.literal(0), z.literal(1)]).optional(),

  selfie: z.string().optional(),

  postal_code: z.string().min(2).max(20).optional(),
  address_type_id: z.number().int().optional(),
  street: z.string().min(2).max(100).optional(),
  number: z.string().min(1).max(20).optional(),
  neighborhood: z.string().min(1).max(50).optional(),
  state: z.string().min(1).max(4).optional(),
  city: z.string().min(1).max(80).optional(),
  country: z.string().min(1).max(4).optional(),
  complement: z.string().min(1).max(4).optional(),

  password: z.string().min(10).max(100).optional(),
})

export type RegisterSimplifySchema = z.infer<
  typeof registerSimplifySchema
>

export type OnboardingResponse = z.infer<typeof onboardingResponseSchema>

export type KnownPendingField = z.infer<typeof pendingFieldEnum>
export type PendingFields = KnownPendingField[]

export type UploadedFile = Record<string, unknown>

