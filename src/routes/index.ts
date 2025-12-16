import { type FastifyInstance } from 'fastify'
import { authRoutes } from './g8.routes'

export async function registerRoutes(app: FastifyInstance) {
  app.register(authRoutes)
}
