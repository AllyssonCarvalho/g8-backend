import dotenv from 'dotenv'
import { defineConfig } from 'drizzle-kit'

dotenv.config()

const isDocker = process.env.DOCKER === 'true'

const databaseUrl = isDocker
  ? process.env.DATABASE_URL!
  : process.env.DATABASE_URL_LOCAL!

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