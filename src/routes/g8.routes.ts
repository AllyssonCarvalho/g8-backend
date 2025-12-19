import { authCustomerToken, getAppToken } from '@/services/g8.service'
import { setAppToken } from '@/utils/cronos-token'
import { type FastifyInstance } from 'fastify'
import { z } from 'zod'

export const authRoutes = async (app: FastifyInstance) => {
  app.get('/token', async (request, reply) => {
    try {
      console.log('Chamando API externa')
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
}
