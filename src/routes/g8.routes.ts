import { authCustomerToken, getAppToken, individualRegisterStep1 } from '@/services/g8.service'
import { setAppToken } from '@/utils/cronos-token'
import { type FastifyInstance } from 'fastify'
import { z } from 'zod'

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

  app.post('/register/step-1', async (request, reply) => {
    const bodySchema = z.object({
      individual_id: z.string().uuid(),
      fullName: z.string().min(1),
      username: z.string().min(1),
      email: z.string().email(),

      dataFundacaoEmpresa: z.string().optional().nullable(),
      cpfRepresentanteEmpresa: z.string().optional().nullable(),
      cnae: z.string().optional().nullable(),
      cnae_descricao: z.string().optional().nullable(),
      capital_social: z.string().optional().nullable(),
      razaoSocial: z.string().optional().nullable(),
      nomeFantasia: z.string().optional().nullable(),
    })

    try {
      const data = bodySchema.parse(request.body)

      const result = await individualRegisterStep1(data)
      console.log(result)

      return reply.code(201).send({
        success: true,
        message: 'Step 1 do registro realizado com sucesso',
        data,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          message: 'Dados inválidos',
          errors: error.flatten().fieldErrors,
        })
      }

      console.error('Erro ao processar step1', error)
      return reply.code(500).send({
        success: false,
        message: 'Erro interno no servidor',
      })
    }
  })
}
