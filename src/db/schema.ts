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
  index,
} from 'drizzle-orm/pg-core'

//Enums
export const tipoContaEnum = pgEnum('tipo_conta', ['cpf', 'cnpj'])
export const onboardingStatusEnum = pgEnum('onboarding_status', [
  'em_cadastro',
  'pendente',
  'completo',
  'enviado',
  'erro',
])

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    

    document: text('document').notNull(),
    tipo_conta: tipoContaEnum('tipo_conta').notNull(),
    
    email: text('email'),
    phone_number: text('phone_number'),
    password_hash: text('password_hash'),
    
    postal_code: varchar('postal_code', { length: 20 }),
    street: varchar('street', { length: 100 }),
    number: varchar('number', { length: 20 }),
    neighborhood: varchar('neighborhood', { length: 50 }),
    city: varchar('city', { length: 80 }),
    state: varchar('state', { length: 4 }),
    country: varchar('country', { length: 4 }),
    complement: varchar('complement', { length: 100 }),
    
    // Status do onboarding
    onboarding_status: onboardingStatusEnum('onboarding_status')
      .notNull()
      .default('em_cadastro'),
    current_step: integer('current_step').default(1),
    
    individual_id: text('individual_id'),
    external_status: text('external_status'),
    
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
    synced_at: timestamp('synced_at', { withTimezone: true }),
  },
  (t) => ({
    documentIdx: uniqueIndex('customers_document_unique').on(t.document),
    statusIdx: index('customers_status_idx').on(t.onboarding_status),
  }),
)

//pf 
export const customerPfData = pgTable('customer_pf_data', {
  id: uuid('id').defaultRandom().primaryKey(),
  customer_id: uuid('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' })
    .unique(),

  name: text('name'),
  full_name: text('full_name'),
  mother_name: text('mother_name'),
  father_name: text('father_name'),
  gender: varchar('gender', { length: 1 }),
  birth_date: date('birth_date', { mode: 'string' }),
  marital_status: integer('marital_status'),
  nationality: text('nationality'),
  nationality_state: varchar('nationality_state', { length: 5 }),
  pep: integer('pep'),

  document_name: text('document_name'),
  document_number: text('document_number'),
  document_state: varchar('document_state', { length: 5 }),
  issuance_date: date('issuance_date', { mode: 'string' }),
  document_issuance: text('document_issuance'),

  created_at: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => sql`now()`),
})

// pj
export const customerPjData = pgTable('customer_pj_data', {
  id: uuid('id').defaultRandom().primaryKey(),
  customer_id: uuid('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' })
    .unique(), 

  razao_social: text('razao_social'),
  nome_fantasia: text('nome_fantasia'),
  foundation_date: date('foundation_date', { mode: 'string' }),
  cnae: text('cnae'),
  cnae_description: text('cnae_description'),
  capital_social: numeric('capital_social', { precision: 18, scale: 2 }),

  created_at: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => sql`now()`),
})

//documents
export const customerDocuments = pgTable('customer_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  customer_id: uuid('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),

  document_type: varchar('document_type', { length: 50 }).notNull(), 

  file_base64: text('file_base64').notNull(),
  file_name: text('file_name'), 
  file_size: integer('file_size'),
  mime_type: text('mime_type'), 

  uploaded_to_external: boolean('uploaded_to_external').default(false),
  external_uploaded_at: timestamp('external_uploaded_at', { withTimezone: true }),

  created_at: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => sql`now()`),
}, (t) => ({
  customerDocIdx: index('customer_documents_customer_idx').on(t.customer_id),
  docTypeIdx: index('customer_documents_type_idx').on(t.document_type),
}))

// socios
export const socios = pgTable('socios', {
  id: uuid('id').defaultRandom().primaryKey(),
  customer_id: uuid('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),

  name: text('name'),
  document: varchar('document', { length: 14 }).notNull(),
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

  created_at: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => sql`now()`),
}, (t) => ({
  customerIdx: index('socios_customer_idx').on(t.customer_id),
}))

// documentos do socios
export const socioDocuments = pgTable('socio_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  socio_id: uuid('socio_id')
    .notNull()
    .references(() => socios.id, { onDelete: 'cascade' }),

  document_type: varchar('document_type', { length: 50 }).notNull(),

  file_base64: text('file_base64').notNull(),
  file_name: text('file_name'),
  file_size: integer('file_size'),
  mime_type: text('mime_type'),

  uploaded_to_external: boolean('uploaded_to_external').default(false),
  external_uploaded_at: timestamp('external_uploaded_at', { withTimezone: true }),

  created_at: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (t) => ({
  socioIdx: index('socio_documents_socio_idx').on(t.socio_id),
}))

export const onboardingProgress = pgTable('onboarding_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  customer_id: uuid('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' })
    .unique(),

  filled_fields: jsonb('filled_fields').$type<string[]>().default([]),
  
  pending_fields: jsonb('pending_fields').$type<string[]>().default([]),
  
  last_sync_pending_fields: jsonb('last_sync_pending_fields').$type<string[]>(),
  last_sync_at: timestamp('last_sync_at', { withTimezone: true }),

  created_at: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => sql`now()`),
})

// histórico
export const onboardingStates = pgTable('onboarding_states', {
  id: uuid('id').defaultRandom().primaryKey(),
  customer_id: uuid('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),

  // Retorno da API
  success: boolean('success').notNull().default(false),
  message: text('message'),
  code: integer('code').notNull(),
  individual_id: text('individual_id'),
  document: text('document').notNull(),
  status: text('status').notNull(),
  status_label: text('status_label'),
  current_step: text('current_step'),
  tipo_conta: tipoContaEnum('tipo_conta').notNull(),

  pending_fields: jsonb('pending_fields').$type<string[]>(),
  uploaded_files: jsonb('uploaded_files').$type<Record<string, unknown>[]>(),

  created_at: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (t) => ({
  customerIdx: index('onboarding_states_customer_idx').on(t.customer_id),
}))