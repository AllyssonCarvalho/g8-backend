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
  individual_id: z.string().optional(),
  phone_prefix: z.string().min(1),
  phone_number: z.string().min(1),
  code: z.string().optional(),
})

export const registerStep3Schema = z.object({
  individual_id: z.string(),
  image_type: z.string(),
  document_type: z.string(),
  file: z.any(),
})

export const registerStep4Schema = z.object({
  individual_id: z
    .string()
    .uuid({ message: 'individual_id deve ser um UUID válido' }),

  document_name: z.string().min(1, 'document_name é obrigatório'),

  mother_name: z.string().min(1, 'mother_name é obrigatório'),

  father_name: z.string().min(1, 'father_name é obrigatório'),

  gender: z.enum(['M', 'F'], {
    message: 'gender deve ser M ou F',
  }),

  birth_date: z
    .string()
    .refine(
      (date) => !Number.isNaN(Date.parse(date)),
      'birth_date deve ser uma data válida (YYYY-MM-DD)',
    ),

  marital_status: z.number().int().min(0, 'marital_status inválido'),

  nationality: z.string().min(1, 'nationality é obrigatório'),

  nationality_state: z
    .string()
    .length(2, 'nationality_state deve ter 2 caracteres'),

  document_number: z.string().min(1, 'document_number é obrigatório'),

  document_state: z.string().length(2, 'document_state deve ter 2 caracteres'),

  issuance_date: z
    .string()
    .refine(
      (date) => !Number.isNaN(Date.parse(date)),
      'issuance_date deve ser uma data válida (YYYY-MM-DD)',
    ),

  document_issuance: z.string().min(1, 'document_issuance é obrigatório'),

  pep: z.number().int().min(0).max(1),

  pep_since: z.string().optional().nullable(),

  renda_mensal: z.number().positive('renda_mensal deve ser maior que zero'),
})

export const registerStep5Schema = z.object({
  individual_id: z.string(),
  image_type: z.string(),
})

export const registerStep6Schema = z.object({
  individual_id: z.string().uuid('individual_id deve ser um UUID válido'),

  postal_code: z
    .string()
    .regex(/^\d{8}$/, 'postal_code deve conter 8 dígitos numéricos'),

  address_type_id: z
    .union([
      z.string().regex(/^\d+$/, 'address_type_id deve ser numérico'),
      z.number().int().positive(),
    ])
    .transform(Number),

  street: z.string().min(1, 'street é obrigatório'),

  number: z.string().min(1, 'number é obrigatório'),

  neighborhood: z.string().min(1, 'neighborhood é obrigatório'),

  state: z.string().length(2, 'state deve ter 2 caracteres'),

  city: z.string().min(1, 'city é obrigatório'),

  country: z.string().length(2, 'country deve ter 2 caracteres'),

  complement: z.string().optional().nullable().default(''),
})

export const registerStep7Schema = z.object({
  individual_id: z
    .string()
    .uuid({ message: 'individual_id deve ser um UUID válido' }),
  password: z
    .string()
    .min(6, { message: 'password deve ter pelo menos 6 caracteres' }),
  confirm_password: z
    .string()
    .min(6, { message: 'confirm_password deve ter pelo menos 6 caracteres' }),
})

export const registerStep1PJSchema = z.object({
  razao_social: z.string().optional(),
  nome_fantasia: z.string().optional(),
  email: z.string().email().optional(),
  data_fundacao_empresa: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido. Use YYYY-MM-DD')
    .optional(),
  cnae: z.string().optional(),
  cnae_descricao: z.string().optional(),
  capital_social: z.string().optional(),
  individual_id: z.string().uuid().optional(),
})

export const registerStep3PJSchema =  z.object({
  // Identificação
  individual_id: z.string().uuid(),

  // Documento principal
  document_name: z.string().min(1),        // rg
  document_number: z.string().min(1),      // número do RG
  document_upload_type: z.string().min(1), // rg

  // CPF (vai virar socios.document)
  cpf: z.string().length(11),

  // Dados pessoais
  full_name: z.string().min(1),
  mother_name: z.string().min(1),
  father_name: z.string().min(1),

  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(['m', 'M', 'f', 'F']),
  marital_status: z.coerce.number().int(),

  pep: z.coerce.number().int(),

  // Nacionalidade / emissão
  nationality: z.string().length(2),        // BR
  nationality_state: z.string().length(2),  // BA
  document_state: z.string().length(2),     // BA
  document_issuance: z.string().min(1),     // SSP
  issuance_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),

  // Participação societária
  percentual_participacao: z.coerce.number(),

  // Arquivos (multipart)
  documento_frente: z.any(),
  documento_verso: z.any(),
  foto_selfie: z.any(),
  foto_comprovante_endereco: z.any(),
})


export type RegisterStep1Data = z.infer<typeof registerStep1Schema>
export type RegisterStep2Data = z.infer<typeof registerStep2Schema>
export type RegisterStep3Data = z.infer<typeof registerStep3Schema>
export type RegisterStep4Data = z.infer<typeof registerStep4Schema>
export type RegisterStep5Data = z.infer<typeof registerStep5Schema>
export type RegisterStep6Data = z.infer<typeof registerStep6Schema>
export type RegisterStep7Data = z.infer<typeof registerStep7Schema>

export type RegisterStep1PJData = z.infer<typeof registerStep1PJSchema>
export type RegisterStep3PJData = z.infer<typeof registerStep3PJSchema>

export type OnboardingResponse = z.infer<typeof onboardingResponseSchema>

export type KnownPendingField = z.infer<typeof pendingFieldEnum>
export type PendingFields = KnownPendingField[]

export type UploadedFile = Record<string, unknown>
