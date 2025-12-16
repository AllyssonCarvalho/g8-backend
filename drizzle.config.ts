import dotenv from 'dotenv'
import { defineConfig } from 'drizzle-kit'

dotenv.config() // garante que o drizzle CLI leia o .env

export default defineConfig({
  out: './drizzle',
  schema:
    process.env.NODE_ENV! === 'production'
      ? './dist/db/schema.js'
      : './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!, // <- AQUI ele pega correto
  },
})
