import { z } from 'zod'
import 'dotenv/config'

const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  G8_BASE_URL: z.string().url(),
  G8_API_KEY: z.string().min(10),

  PUBLIC_KEY: z.string().min(10),
  PRIVATE_KEY: z.string().min(10),

  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DB: z.string(),
  POSTGRES_HOST: z.string(),
  POSTGRES_PORT: z.coerce.number(),

  DATABASE_URL: z.string().url(),
})

export const env = envSchema.parse(process.env)
