CREATE TYPE "public"."onboarding_status" AS ENUM('em_cadastro', 'pendente', 'completo', 'enviado', 'erro');--> statement-breakpoint
CREATE TYPE "public"."tipo_conta" AS ENUM('cpf', 'cnpj');--> statement-breakpoint
CREATE TABLE "customer_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"file_base64" text NOT NULL,
	"file_name" text,
	"file_size" integer,
	"mime_type" text,
	"uploaded_to_external" boolean DEFAULT false,
	"external_uploaded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_pf_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"name" text,
	"full_name" text,
	"mother_name" text,
	"father_name" text,
	"gender" varchar(1),
	"birth_date" date,
	"marital_status" integer,
	"nationality" text,
	"nationality_state" varchar(5),
	"pep" integer,
	"document_name" text,
	"document_number" text,
	"document_state" varchar(5),
	"issuance_date" date,
	"document_issuance" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_pf_data_customer_id_unique" UNIQUE("customer_id")
);
--> statement-breakpoint
CREATE TABLE "customer_pj_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"razao_social" text,
	"nome_fantasia" text,
	"foundation_date" date,
	"cnae" text,
	"cnae_description" text,
	"capital_social" numeric(18, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_pj_data_customer_id_unique" UNIQUE("customer_id")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document" text NOT NULL,
	"tipo_conta" "tipo_conta" NOT NULL,
	"email" text,
	"phone_number" text,
	"password_hash" text,
	"postal_code" varchar(20),
	"street" varchar(100),
	"number" varchar(20),
	"neighborhood" varchar(50),
	"city" varchar(80),
	"state" varchar(4),
	"country" varchar(4),
	"complement" varchar(100),
	"onboarding_status" "onboarding_status" DEFAULT 'em_cadastro' NOT NULL,
	"current_step" integer DEFAULT 1,
	"individual_id" text,
	"external_status" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"synced_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "onboarding_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"filled_fields" jsonb DEFAULT '[]'::jsonb,
	"pending_fields" jsonb DEFAULT '[]'::jsonb,
	"last_sync_pending_fields" jsonb,
	"last_sync_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "onboarding_progress_customer_id_unique" UNIQUE("customer_id")
);
--> statement-breakpoint
CREATE TABLE "onboarding_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"success" boolean DEFAULT false NOT NULL,
	"message" text,
	"code" integer NOT NULL,
	"individual_id" text,
	"document" text NOT NULL,
	"status" text NOT NULL,
	"status_label" text,
	"current_step" text,
	"tipo_conta" "tipo_conta" NOT NULL,
	"pending_fields" jsonb,
	"uploaded_files" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "socio_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"socio_id" uuid NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"file_base64" text NOT NULL,
	"file_name" text,
	"file_size" integer,
	"mime_type" text,
	"uploaded_to_external" boolean DEFAULT false,
	"external_uploaded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "socios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"name" text,
	"document" varchar(14) NOT NULL,
	"document_name" varchar(3),
	"document_number" text,
	"mother_name" text,
	"father_name" text,
	"pep" integer,
	"document_issuance" text,
	"document_state" varchar(5),
	"issuance_date" date,
	"nationality" text,
	"nationality_state" varchar(5),
	"marital_status" integer,
	"birth_date" date,
	"gender" varchar(1),
	"percentual_participacao" numeric(7, 4),
	"majority" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_documents" ADD CONSTRAINT "customer_documents_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_pf_data" ADD CONSTRAINT "customer_pf_data_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_pj_data" ADD CONSTRAINT "customer_pj_data_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_progress" ADD CONSTRAINT "onboarding_progress_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_states" ADD CONSTRAINT "onboarding_states_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "socio_documents" ADD CONSTRAINT "socio_documents_socio_id_socios_id_fk" FOREIGN KEY ("socio_id") REFERENCES "public"."socios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "socios" ADD CONSTRAINT "socios_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customer_documents_customer_idx" ON "customer_documents" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customer_documents_type_idx" ON "customer_documents" USING btree ("document_type");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_document_unique" ON "customers" USING btree ("document");--> statement-breakpoint
CREATE INDEX "customers_status_idx" ON "customers" USING btree ("onboarding_status");--> statement-breakpoint
CREATE INDEX "onboarding_states_customer_idx" ON "onboarding_states" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "socio_documents_socio_idx" ON "socio_documents" USING btree ("socio_id");--> statement-breakpoint
CREATE INDEX "socios_customer_idx" ON "socios" USING btree ("customer_id");