import { env } from '../config/env'
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'

// You can specify any property from the node-postgres connection options
const db = drizzle({
  connection: {
    connectionString: env.DATABASE_URL,
  },
})

export { db }
