import { authCustomerToken, getAppToken, individualRegister } from '@/cronos'
import { RegisterSimplifySchema } from '@/schemas/cronos/onboardig-response.schema'
import { registerSimplify } from '@/services/auth.service'
import { setAppToken } from '@/utils/cronos-token'
import { FastifyInstance } from 'fastify'

export const authRoutes = async (app: FastifyInstance) => {
  app.get('/token', async (request, reply) => {
    try {
      const response = await getAppToken()

      setAppToken(response.data.token)

      return reply.send({
        success: true,
        data: response.data,
      })
    } catch (error) {
      console.error('Erro ao chamar API externa', error)
      return reply.code(500).send({
        success: false,
        message: 'Erro ao chamar API externa',
      })
    }
  })

  app.post('/customer-token', async (request, reply) => {
    try {
      const response = await authCustomerToken(
        process.env.PUBLIC_KEY!,
        process.env.PRIVATE_KEY!,
      )
      return reply.send({
        success: true,
        data: response.data,
      })
    } catch (error) {
      console.error('Erro ao chamar API externa', error)
      return reply.code(500).send({
        success: false,
        message: 'Erro ao chamar API externa',
      })
    }
  })

  app.post('/register', async (request, reply) => {
    const { document } = request.body as { document: string }
    try {
      const response = await individualRegister({ document })
      return reply.send({
        success: true,
        data: response,
      })
    } catch (error) {
      console.error('Erro ao chamar API externa', error)
      return reply.code(500).send({
        success: false,
        message: 'Erro ao chamar API externa',
      })
    }
  })

  app.post('/register/simplify/:individual_id', async (request, reply) => {
    const { individual_id } = request.params as {
      individual_id: string
    }

    const payload = request.body as RegisterSimplifySchema

    try {
      const data = await registerSimplify(individual_id, payload)

      return reply.send({
        success: true,
        data,
      })
    } catch (error) {
      console.error('Erro ao registrar conta', error)

      return reply.code(500).send({
        success: false,
        message: 'Erro ao chamar API externa',
      })
    }
  })
}
