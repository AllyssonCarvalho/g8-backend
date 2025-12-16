import { sql } from 'drizzle-orm'
import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  date,
  timestamp,
  jsonb,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const tipoContaEnum = pgEnum('tipo_conta', ['cpf', 'cnpj'])

export const onboardingStates = pgTable('onboarding_states', {
  id: uuid('id').defaultRandom().primaryKey(),

  // retorno da API
  success: boolean('success').notNull().default(false),
  message: text('message'),
  code: integer('code').notNull(),
  individual_id: text('individual_id'),
  document: text('document').notNull(),
  status: text('status').notNull(),
  status_label: text('status_label'),
  current_step: text('current_step'),
  tipo_conta: tipoContaEnum('tipo_conta').notNull(),

  // listas/objetos variáveis
  pending_fields: jsonb('pending_fields').$type<string[]>(),
  uploaded_files: jsonb('uploaded_files').$type<Record<string, unknown>[]>(),

  created_at: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

/**
 * Customer PF/PJ
 * Quase tudo nullable pq o onboarding pode ser aos poucos.
 */
export const customers = pgTable(
  'customers',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    document: text('document').notNull(),
    tipo_conta: tipoContaEnum('tipo_conta').notNull(),
    individual_id: text('individual_id'),

    //serve pros dois
    full_name: text('full_name'),
    name: text('name'),
    razao_social: text('razao_social'),
    email: text('email'),
    phone_number: text('phone_number'),
    code: text('code'),
    password_hash: text('password_hash'),

    // PF
    document_name: text('document_name'),
    mother_name: text('mother_name'),
    gender: varchar('gender', { length: 1 }),
    birth_date: date('birth_date', { mode: 'string' }),
    marital_status: integer('marital_status'),
    nationality: text('nationality'),
    nationality_state: varchar('nationality_state', { length: 5 }),

    document_number: text('document_number'),
    document_state: varchar('document_state', { length: 5 }),
    issuance_date: date('issuance_date', { mode: 'string' }),
    document_issuance: text('document_issuance'),
    pep: integer('pep'),

    //endereço(PF e PJ)
    postal_code: varchar('postal_code', { length: 20 }),
    number: varchar('number', { length: 20 }),
    street: varchar('street', { length: 100 }),
    city: varchar('city', { length: 80 }),
    neighborhood: varchar('neighborhood', { length: 50 }),
    state: varchar('state', { length: 4 }),
    country: varchar('country', { length: 4 }),

    // PJ
    data_fundacao_empresa: date('data_fundacao_empresa', { mode: 'string' }),
    cnae: text('cnae'),
    cnae_descricao: text('cnae_descricao'),
    capital_social: numeric('capital_social', { precision: 18, scale: 2 }),

    foto_selfie: text('foto_selfie'),
    contrato_social: text('contrato_social'),
    cartao_cnpj: text('cartao_cnpj'),

    socios: jsonb('socios').$type<Record<string, unknown>[]>(),

    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (t) => ({
    documentIdx: uniqueIndex('customers_document_unique').on(t.document),
  }),
)

//Sócios (PJ)

export const socios = pgTable('socios', {
  id: uuid('id').defaultRandom().primaryKey(),
  customer_id: uuid('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),

  name: text('name'),
  document: varchar('document', { length: 14 }),
  document_name: varchar('document_name', { length: 3 }),
  document_number: text('document_number'),

  mother_name: text('mother_name'),
  father_name: text('father_name'),
  pep: integer('pep'),
  document_issuance: text('document_issuance'),
  document_state: varchar('document_state', { length: 5 }),
  issuance_date: date('issuance_date', { mode: 'string' }),

  nationality: text('nationality'),
  nationality_state: varchar('nationality_state', { length: 5 }),
  marital_status: integer('marital_status'),
  birth_date: date('birth_date', { mode: 'string' }),
  gender: varchar('gender', { length: 1 }),

  percentual_participacao: numeric('percentual_participacao', {
    precision: 7,
    scale: 4,
  }),
  majority: boolean('majority'),

  // arquivos do sócio
  rg_frente: text('rg_frente'),
  rg_verso: text('rg_verso'),
  cnh_frente: text('cnh_frente'),
  cnh_verso: text('cnh_verso'),
  rne_frente: text('rne_frente'),
  rne_verso: text('rne_verso'),
  selfie: text('selfie'),
  comprovante_endereco: text('comprovante_endereco'),

  created_at: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})
