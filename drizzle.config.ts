import dotenv from 'dotenv'
import { defineConfig } from 'drizzle-kit'

dotenv.config() // garante que o drizzle CLI leia o .env

// Permite sobrescrever DATABASE_URL via variável de ambiente para desenvolvimento local
// Exemplo: DATABASE_URL_LOCAL=postgresql://user:pass@localhost:5432/db npm run db:push
const databaseUrl = process.env.DATABASE_URL_LOCAL || process.env.DATABASE_URL!

export default defineConfig({
  out: './drizzle',
  schema:
    process.env.NODE_ENV! === 'production'
      ? './dist/db/schema.js'
      : './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
})
