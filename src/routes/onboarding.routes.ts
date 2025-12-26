import {
  registerStep1Schema,
  registerStep2Schema,
  registerStep3Schema,
} from '@/schemas/cronos/g8.schemas'
import {
  individualRegister,
  individualRegisterStep1,
} from '@/services/g8.service'
import {
  deletarSocio,
  getUserOnboardingSituation,
  registerStep2,
  registerStep2_1,
  registerStep3,
  registerStepStep3_1,
  registerStepStep3_2,
  resendCode,
} from '@/services/onboarding.service'
import { FastifyInstance } from 'fastify'
import { Writable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import z from 'zod'

export const onboardingRoutes = async (app: FastifyInstance) => {
  app.get('/user/onboarding/:document', async (request, reply) => {
    try {
      const { document } = request.params as { document: string }
      const userSituation = await getUserOnboardingSituation(document)
      return reply.send({
        success: true,
        data: userSituation,
      })
    } catch (error) {
      console.error('Erro ao obter situação do usuário', error)
      return reply.code(500).send({
        success: false,
        message: 'Erro interno no servidor',
      })
    }
  })

  app.post('/onboarding/start', async (request, reply) => {
    try {
      const { document } = request.body as { document: string }

      const result = await individualRegister({ document })

      return reply.code(201).send({
        success: true,
        message: 'Onboarding iniciado com sucesso',
        data: result,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          message: 'Dados inválidos',
          errors: error.flatten().fieldErrors,
        })
      }

      console.error('Erro ao iniciar onboarding', error)
      return reply.code(500).send({
        success: false,
        message: 'Erro interno no servidor',
      })
    }
  })

  app.post('/register/step-1', async (request, reply) => {
    try {
      const data = registerStep1Schema.parse(request.body)

      const result = await individualRegisterStep1(data)

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

      return reply.code(500).send({
        success: false,
        message: 'Erro interno no servidor',
      })
    }
  })

  app.post('/register/step-2', async (request, reply) => {
    try {
      const data = registerStep2Schema.parse(request.body)

      const result = await registerStep2(data)

      return reply.code(201).send({
        success: true,
        message: 'Step 2 do registro realizado com sucesso',
        data: result,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          message: 'Dados inválidos',
          errors: error.flatten().fieldErrors,
        })
      }

      return reply.code(500).send({
        success: false,
        message: 'Erro interno no servidor',
      })
    }
  })

  app.put('/register/step-2-1', async (request, reply) => {
    try {
      const data = registerStep2Schema.parse(request.body)

      const result = await registerStep2_1(data)
      return reply.code(201).send({
        success: true,
        message: 'Step 2 do registro realizado com sucesso',
        data: result,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          message: 'Dados inválidos',
          errors: error.flatten().fieldErrors,
        })
      }

      return reply.code(500).send({
        success: false,
        message: 'Erro interno no servidor',
      })
    }
  })

  app.post('/onboarding/step-2-1/resend-code', async (request, reply) => {
    const bodySchema = z.object({
      individual_id: z.string(),
    })

    try {
      const data = bodySchema.parse(request.body)

      const result = await resendCode(data.individual_id)
      return reply.code(201).send({
        success: true,
        message: 'Código reenviado com sucesso',
        data: result,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          message: 'Dados inválidos',
          errors: error.flatten().fieldErrors,
        })
      }

      return reply.code(500).send({
        success: false,
        message: 'Erro interno no servidor',
      })
    }
  })

  app.post('/onboarding/step-3', async (request, reply) => {
    try {
      const parts = request.parts()

      const fields: Record<string, any> = {}
      let file: any = null

      for await (const part of parts) {
        if (part.type === 'file') {
          file = part

          // ⬇️ CONSUME O STREAM (IMPORTANTE)
          await pipeline(
            part.file,
            new Writable({
              write(_chunk, _enc, cb) {
                cb()
              },
            }),
          )
        } else {
          fields[part.fieldname] = part.value
        }
      }

      const data = registerStep3Schema.parse(fields)

      const result = await registerStep3({
        ...data,
        file,
      })

      return reply.code(201).send({
        success: true,
        message: 'Step 3 realizado com sucesso',
        data: result,
      })
    } catch (error) {
      return reply.code(500).send({ error: 'Erro interno' })
    }
  })

  // 3.1 APENAS PJ
  app.get('/onboarding/step-3-1/:individual_id', async (request, reply) => {
    try {
      const { individual_id } = request.params as { individual_id: string }
      const socios = await registerStepStep3_1(individual_id)
      return reply.send({
        success: true,
        data: socios,
      })
    } catch (error) {
      console.error('Erro ao obter lista de socios', error)
      return reply.code(500).send({
        success: false,
        message: 'Erro interno no servidor',
      })
    }
  })

  //3.2 apenas pj
  app.put('/onboarding/step-3-2/:individual_id', async (request, reply) => {
    try {
      const { individual_id } = request.params as { individual_id: string }
      const { id_socio } = request.body as { id_socio: string }

      const socios = await registerStepStep3_2(individual_id, id_socio)
      return reply.send({
        success: true,
        data: socios,
      })
    } catch (error) {
      console.error('Erro ao obter lista de socios', error)
      return reply.code(500).send({
        success: false,
        message: 'Erro interno no servidor',
      })
    }
  })

  app.delete('/onboarding/step-3/', async (request, reply) => {
    try {
      const { individual_id, id_socio } = request.query as {
        individual_id: string
        id_socio: string
      }
      const socios = await deletarSocio(individual_id, id_socio)
      return reply.send({
        success: true,
        data: socios,
      })
    } catch (error) {
      console.error('Erro ao deletar socio', error)
    }
  })
}
