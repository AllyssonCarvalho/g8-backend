import { type FastifyInstance } from 'fastify'
import { authRoutes } from './auth.routes'
import { onboardingPjRoutes } from './onboarding-pj.routes'
import { onboardingRoutes } from './onboarding.routes'

export async function registerRoutes(app: FastifyInstance) {
  app.register(authRoutes)
  app.register(onboardingPjRoutes)
  app.register(onboardingRoutes)
}
