import { z } from 'zod'
import 'dotenv/config'

const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  G8_BASE_URL: z.string(),
  G8_API_KEY: z.string().min(10),

  PUBLIC_KEY: z.string().min(10),
  PRIVATE_KEY: z.string().min(10),

  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DB: z.string(),
  POSTGRES_HOST: z.string(),
  POSTGRES_PORT: z.coerce.number(),

  // DATABASE_URL é opcional, será construído se não fornecido
  DATABASE_URL: z.string().url().optional(),
})

const parsedEnv = envSchema.parse(process.env)

// Constrói DATABASE_URL se não foi fornecido
const databaseUrl =
  parsedEnv.DATABASE_URL ||
  `postgresql://${parsedEnv.POSTGRES_USER}:${parsedEnv.POSTGRES_PASSWORD}@${parsedEnv.POSTGRES_HOST}:${parsedEnv.POSTGRES_PORT}/${parsedEnv.POSTGRES_DB}`

export const env = {
  ...parsedEnv,
  DATABASE_URL: databaseUrl,
}
