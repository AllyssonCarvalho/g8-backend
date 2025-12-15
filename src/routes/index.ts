import { type FastifyInstance } from 'fastify'
import { authRoutes } from './auth'

export async function registerRoutes(app: FastifyInstance) {
  app.register(authRoutes)
}
