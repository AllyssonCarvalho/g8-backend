import { type FastifyInstance } from 'fastify'
import { authRoutes } from './g8.routes'
import { onboardingPjRoutes } from './onboarding-pj.routes'

export async function registerRoutes(app: FastifyInstance) {
  app.register(authRoutes)
  app.register(onboardingPjRoutes)
}
