import { fastifyCors } from '@fastify/cors'
import { fastifySwagger } from '@fastify/swagger'
import ScalarApiReference from '@scalar/fastify-api-reference'
import { fastify } from 'fastify'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { env } from 'process'
import { registerRoutes } from './routes'
import fastifyMultipart from '@fastify/multipart'

export async function buildServer() {
  const app = fastify().withTypeProvider<ZodTypeProvider>()

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  app.register(fastifyMultipart)

  app.register(fastifyCors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  })

  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'G8-CRONOS API',
        description: 'API for integration G8 and Cronos',
        version: '1.0.0',
      },
    },
    transform: jsonSchemaTransform,
  })

  app.register(ScalarApiReference, {
    routePrefix: '/docs',
  })

  await registerRoutes(app)

  return app
}

buildServer().then((app) => {
  app.listen({ port: Number(process.env.PORT) ?? 3333, host: '0.0.0.0' })
  console.log(`HTTP server running on http://localhost:${process.env.PORT ?? 3333}`)
  console.log(`Swagger docs available on http://localhost:${process.env.PORT ?? 3333}/docs`)
})
