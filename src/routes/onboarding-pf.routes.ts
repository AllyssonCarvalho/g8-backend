import {
  createCustomer,
  findCustomerByDocument,
} from '@/repositories/customer.repository'
import {
  registerStep1Schema,
  registerStep2Schema,
  registerStep3Schema,
  registerStep4Schema,
  registerStep5Schema,
  registerStep6Schema,
  registerStep7Schema,
} from '@/schemas/cronos/g8.schemas'
import {
  individualRegister,
  individualRegisterStep1,
} from '@/services/g8.service'
import {
  getUserOnboardingSituation,
  registerStep2,
  registerStep2_1,
  registerStep3,
  registerStep4,
  registerStep5,
  registerStep6,
  registerStep7,
  resendCode,
} from '@/services/onboarding.service'
import { consultaCep } from '@/services/onboarding.service'
import { FastifyInstance } from 'fastify'
import z from 'zod'

export const onboardingRoutes = async (app: FastifyInstance) => {
  app.get('/onboarding/user/:document', async (request, reply) => {
    const { document } = request.params as { document: string }
    const userSituation = await getUserOnboardingSituation(document)

    const customer = await findCustomerByDocument(document)

    return reply.send({
      success: true,
      data: userSituation,
      customer,
    })
  })

  app.post('/onboarding/start', async (request, reply) => {
    const { document } = request.body as { document: string }

    const result = await individualRegister({ document })

    const isPF = document.length === 11

    const customer = await createCustomer({
      document,
      tipo_conta: isPF ? 'cpf' : 'cnpj',
      individual_id: result.individual_id,
    })

    return reply.code(201).send({
      success: true,
      message: 'Onboarding iniciado com sucesso',
      data: result,
      customer,
    })
  })

  app.post('/onboarding/step-1', async (request, reply) => {
      const data = registerStep1Schema.parse(request.body)
      console.log("DATA STEP 1: ", data);

      const {
        parsed, updatedCustomer
      } = await individualRegisterStep1(data)

      return reply.code(201).send({
        success: true,
        message: 'Step 1 do registro realizado com sucesso',
        data: parsed,
        customer: updatedCustomer
      })
    
  })

  app.post('/onboarding/step-2', async (request, reply) => {
      const data = registerStep2Schema.parse(request.body)

      const { data: result, updatedCustomer} = await registerStep2(data)

      return reply.code(201).send({
        success: true,
        message: 'Step 2 do registro realizado com sucesso',
        data: result,
        updatedCustomer
      })
    
  })

  app.put('/onboarding/step-2-1', async (request, reply) => {
      const data = registerStep2Schema.parse(request.body)

      const result = await registerStep2_1(data)
      return reply.code(201).send({
        success: true,
        message: 'Step 2 do registro realizado com sucesso',
        data: result,
      })
    
  })

  app.post('/onboarding/step-2-1/resend-code', async (request, reply) => {
    const bodySchema = z.object({
      individual_id: z.string(),
    })
      const data = bodySchema.parse(request.body)

      const result = await resendCode(data.individual_id)
      return reply.code(201).send({
        success: true,
        message: 'Código reenviado com sucesso',
        data: result,
      })

  })

  app.post('/onboarding/step-3', async (request, reply) => {
      const parts = request.parts()

      const fields: Record<string, any> = {}
      let fileBase64: string | null = null
      let fileMeta: {
        filename: string
        mimetype: string
      } | null = null

      for await (const part of parts) {
        if (part.type === 'file') {
          const chunks: Buffer[] = []

          for await (const chunk of part.file) {
            chunks.push(chunk)
          }

          const buffer = Buffer.concat(chunks)
          fileBase64 = buffer.toString('base64')

          fileMeta = {
            filename: part.filename,
            mimetype: part.mimetype,
          }
        } else {
          fields[part.fieldname] = part.value
        }
      }

      if (!fileBase64 || !fileMeta) {
        return reply.code(400).send({ error: 'Arquivo é obrigatório' })
      }

      const data = registerStep3Schema.parse(fields)

      const result = await registerStep3({
        ...data,
        fileBase64,
        fileMimeType: fileMeta.mimetype,
        fileName: fileMeta.filename,
      })

      return reply.code(201).send({
        success: true,
        message: 'Step 3 realizado com sucesso',
        data: result.data,
        customer: result.updatedCustomer
      })
    
  })

  app.post('/onboarding/step-4', async (request, reply) => {
    const data = registerStep4Schema.parse(request.body)
    console.log("DATA STEP 4: ", data);
    const { data: result, user } = await registerStep4(data)
    return reply.code(201).send({
      success: true,
      message: 'Step 4 do registro realizado com sucesso',
      data: result,
      user
    })
  })

  app.post('/onboarding/step-5', async (request, reply) => {
      const parts = request.parts()

      const fields: Record<string, any> = {}
      let fileBase64: string | null = null
      let fileMeta: {
        filename: string
        mimetype: string
      } | null = null

      for await (const part of parts) {
        if (part.type === 'file') {
          const chunks: Buffer[] = []

          for await (const chunk of part.file) {
            chunks.push(chunk)
          }

          const buffer = Buffer.concat(chunks)
          fileBase64 = buffer.toString('base64')

          fileMeta = {
            filename: part.filename,
            mimetype: part.mimetype,
          }
        } else {
          fields[part.fieldname] = part.value
        }
      }

      if (!fileBase64 || !fileMeta) {
        return reply.code(400).send({ error: 'Arquivo é obrigatório' })
      }

      const data = registerStep5Schema.parse(fields)

      const result = await registerStep5({
        ...data,
        fileBase64,
        fileMimeType: fileMeta.mimetype,
        fileName: fileMeta.filename,
      })

      return reply.code(201).send({
        success: true,
        message: 'Step 5 realizado com sucesso',
        data: result.data,
        customer: result.updatedCustomer
      })
  })

  app.post('/onboarding/step-6', async (request, reply) => {
    const data = registerStep6Schema.parse(request.body)

    const { data: result, updatedUser } = await registerStep6(data)
    return reply.code(201).send({
      success: true,
      message: 'Step 4 do registro realizado com sucesso',
      data: result,
      updatedUser
    })
  })

  app.post('/onboarding/step-7', async (request, reply) => {
    const data = registerStep7Schema.parse(request.body)

    const { data: result, updatedUser } = await registerStep7(data)
    return reply.code(201).send({
      success: true,
      message: 'Step 4 do registro realizado com sucesso',
      data: result,
      updatedUser
    })
  })

  // CEP (g8)
  app.get('/consultcep/:cep', async (request, reply) => {
    try {
      const { cep } = request.params as { cep: string }
      const response = await consultaCep(cep)
      const data = await response.data
      return reply.send({
        success: true,
        data,
      })
    } catch (error) {
      console.error('Erro ao obter dados do cep', error)
      return reply.code(404).send({
        success: false,
        message: 'CEP não encontrado',
      })
    }
  })
}
