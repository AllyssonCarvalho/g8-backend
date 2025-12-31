import dotenv from 'dotenv'
import { defineConfig } from 'drizzle-kit'

dotenv.config()

const databaseUrl = process.env.DATABASE_URL || 
  process.env.DATABASE_URL_LOCAL ||
  (process.env.POSTGRES_USER && process.env.POSTGRES_PASSWORD && process.env.POSTGRES_HOST && process.env.POSTGRES_DB
    ? `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB}`
    : null)

if (!databaseUrl) {
  throw new Error('DATABASE_URL ou variáveis POSTGRES_* são obrigatórias')
}

export default defineConfig({
  out: './drizzle',
  schema:
    process.env.NODE_ENV === 'production'
      ? './dist/db/schema.js'
      : './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
})