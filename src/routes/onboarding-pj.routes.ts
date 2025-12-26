import { type FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '@/db'
import { customers } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import {
  upsertCustomerPjData,
  upsertSocio,
  addCustomerDocument,
  addSocioDocument,
  getCustomerPjById,
} from '@/repositories/customer-pj.repository'
import {
  startPjOnboarding,
  syncPjToExternalApi,
} from '@/services/onboarding-pj.service'
import {
  buildPjApiPayload,
  validatePjPayload,
} from '@/services/payload-builder.service'

export const onboardingPjRoutes = async (app: FastifyInstance) => {
  app.post(
    '/onboarding/pj/start',
    {
      schema: {
        body: z.object({
          document: z.string().min(14).max(14),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { document } = request.body as { document: string }

        const result = await startPjOnboarding(document)

        return reply.send({
          success: true,
          data: {
            customer_id: result.customer_id,
            individual_id: result.individual_id,
            status: result.response.status,
            pending_fields: result.response.pending_fields,
          },
        })
      } catch (error: any) {
        console.error('Erro ao iniciar onboarding PJ', error)
        return reply.code(500).send({
          success: false,
          message: error.message || 'Erro ao iniciar onboarding',
        })
      }
    },
  )

  app.patch(
    '/onboarding/pj/:customerId/company',
    {
      schema: {
        params: z.object({
          customerId: z.string().uuid(),
        }),
        body: z.object({
          razao_social: z.string().optional(),
          nome_fantasia: z.string().optional(),
          email: z.string().email().optional(),
          phone_number: z.string().optional(),
          foundation_date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido. Use YYYY-MM-DD')
            .optional(),
          cnae: z.string().optional(),
          cnae_description: z.string().optional(),
          capital_social: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { customerId } = request.params as { customerId: string }
        const data = request.body as any

        if (data.email || data.phone_number) {
          await db
            .update(customers)
            .set({
              email: data.email,
              phone_number: data.phone_number,
            })
            .where(eq(customers.id, customerId))
          
          // Atualiza o updated_at manualmente
          await db.execute(
            sql`UPDATE customers SET updated_at = now() WHERE id = ${customerId}`
          )
        }

        // Prepara os dados da empresa, garantindo tipos corretos
        const pjData: {
          razao_social?: string
          nome_fantasia?: string
          foundation_date?: string
          cnae?: string
          cnae_description?: string
          capital_social?: string
        } = {}
        
        if (data.razao_social) pjData.razao_social = String(data.razao_social)
        if (data.nome_fantasia) pjData.nome_fantasia = String(data.nome_fantasia)
        if (data.foundation_date) {
          // Garante que a data seja uma string no formato YYYY-MM-DD
          const dateStr = String(data.foundation_date).trim()
          // Valida o formato antes de salvar
          if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return reply.code(400).send({
              success: false,
              message: 'Formato de data inválido. Use YYYY-MM-DD',
            })
          }
          pjData.foundation_date = dateStr
        }
        if (data.cnae) pjData.cnae = String(data.cnae)
        if (data.cnae_description)
          pjData.cnae_description = String(data.cnae_description)
        if (data.capital_social) pjData.capital_social = String(data.capital_social)

        if (Object.keys(pjData).length > 0) {
          await upsertCustomerPjData(customerId, pjData)
        }

        return reply.send({
          success: true,
          message: 'Dados da empresa atualizados',
        })
      } catch (error: any) {
        console.error('Erro ao atualizar dados da empresa', error)
        return reply.code(500).send({
          success: false,
          message: error.message || 'Erro ao atualizar dados',
        })
      }
    },
  )

  app.patch(
    '/onboarding/pj/:customerId/address',
    {
      schema: {
        params: z.object({
          customerId: z.string().uuid(),
        }),
        body: z.object({
          postal_code: z.string().optional(),
          street: z.string().optional(),
          number: z.string().optional(),
          neighborhood: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          country: z.string().optional(),
          complement: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { customerId } = request.params as { customerId: string }
        const data = request.body as any

        await db.update(customers).set(data).where(eq(customers.id, customerId))

        return reply.send({
          success: true,
          message: 'Endereço atualizado',
        })
      } catch (error: any) {
        console.error('Erro ao atualizar endereço', error)
        return reply.code(500).send({
          success: false,
          message: error.message || 'Erro ao atualizar endereço',
        })
      }
    },
  )

  app.post(
    '/onboarding/pj/:customerId/documents',
    {
      schema: {
        params: z.object({
          customerId: z.string().uuid(),
        }),
        body: z.object({
          document_type: z.enum([
            'contrato_social',
            'cartao_cnpj',
            'comprovante_endereco',
          ]),
          file_base64: z.string(),
          file_name: z.string().optional(),
          mime_type: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { customerId } = request.params as { customerId: string }
        const data = request.body as any

        await addCustomerDocument(customerId, data)

        return reply.send({
          success: true,
          message: 'Documento adicionado',
        })
      } catch (error: any) {
        console.error('Erro ao adicionar documento', error)
        return reply.code(500).send({
          success: false,
          message: error.message || 'Erro ao adicionar documento',
        })
      }
    },
  )

  app.post(
    '/onboarding/pj/:customerId/socios',
    {
      schema: {
        params: z.object({
          customerId: z.string().uuid(),
        }),
        body: z.object({
          document: z.string(),
          name: z.string().optional(),
          document_name: z.string().optional(),
          document_number: z.string().optional(),
          mother_name: z.string().optional(),
          father_name: z.string().optional(),
          pep: z.number().optional(),
          document_issuance: z.string().optional(),
          document_state: z.string().optional(),
          issuance_date: z.string().optional(),
          nationality: z.string().optional(),
          nationality_state: z.string().optional(),
          marital_status: z.number().optional(),
          birth_date: z.string().optional(),
          gender: z.string().optional(),
          percentual_participacao: z.string().optional(),
          majority: z.boolean().optional(),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { customerId } = request.params as { customerId: string }
        const data = request.body as any

        const socio = await upsertSocio(customerId, data)

        return reply.send({
          success: true,
          data: { socio_id: socio.id },
          message: 'Sócio adicionado/atualizado',
        })
      } catch (error: any) {
        console.error('Erro ao adicionar sócio', error)
        return reply.code(500).send({
          success: false,
          message: error.message || 'Erro ao adicionar sócio',
        })
      }
    },
  )

  app.post(
    '/onboarding/pj/socios/:socioId/documents',
    {
      schema: {
        params: z.object({
          socioId: z.string().uuid(),
        }),
        body: z.object({
          document_type: z.enum([
            'rg_frente',
            'rg_verso',
            'cnh_frente',
            'cnh_verso',
            'rne_frente',
            'rne_verso',
            'selfie',
            'comprovante_endereco',
          ]),
          file_base64: z.string(),
          file_name: z.string().optional(),
          mime_type: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { socioId } = request.params as { socioId: string }
        const data = request.body as any

        await addSocioDocument(socioId, data)

        return reply.send({
          success: true,
          message: 'Documento do sócio adicionado',
        })
      } catch (error: any) {
        console.error('Erro ao adicionar documento do sócio', error)
        return reply.code(500).send({
          success: false,
          message: error.message || 'Erro ao adicionar documento',
        })
      }
    },
  )

  app.get('/onboarding/pj/:customerId/validation', async (request, reply) => {
    try {
      const { customerId } = request.params as { customerId: string }

      const payload = await buildPjApiPayload(customerId)
      const validation = validatePjPayload(payload)

      return reply.send({
        success: true,
        data: {
          valid: validation.valid,
          missing_fields: validation.missingFields,
          payload_preview: Object.keys(payload),
        },
      })
    } catch (error: any) {
      console.error('Erro ao validar', error)
      return reply.code(500).send({
        success: false,
        message: error.message || 'Erro ao validar',
      })
    }
  })

  app.post('/onboarding/pj/:customerId/sync', async (request, reply) => {
    try {
      const { customerId } = request.params as { customerId: string }

      const response = await syncPjToExternalApi(customerId)

      return reply.send({
        success: true,
        data: {
          status: response.status,
          message: response.message,
          pending_fields: response.pending_fields,
        },
      })
    } catch (error: any) {
      console.error('Erro ao sincronizar com API externa', error)
      return reply.code(500).send({
        success: false,
        message: error.message || 'Erro ao sincronizar',
      })
    }
  })

  app.post(
    '/onboarding/pj/:customerId/complete',
    {
      schema: {
        params: z.object({
          customerId: z.string().uuid(),
        }),
        body: z.object({
          razao_social: z.string().optional(),
          nome_fantasia: z.string().optional(),
          email: z.string().email().optional(),
          phone_number: z.string().optional(),
          foundation_date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido. Use YYYY-MM-DD')
            .optional(),
          cnae: z.string().optional(),
          cnae_description: z.string().optional(),
          capital_social: z.string().optional(),
          postal_code: z.string().optional(),
          street: z.string().optional(),
          number: z.string().optional(),
          neighborhood: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          country: z.string().optional(),
          complement: z.string().optional(),
          documentos_empresa: z
            .array(
              z.object({
                document_type: z.enum([
                  'contrato_social',
                  'cartao_cnpj',
                  'comprovante_endereco',
                ]),
                file_base64: z.string(),
                file_name: z.string().optional(),
                mime_type: z.string().optional(),
              }),
            )
            .optional(),
          socios: z
            .array(
              z.object({
                document: z.string(),
                name: z.string().optional(),
                document_name: z.string().optional(),
                document_number: z.string().optional(),
                mother_name: z.string().optional(),
                father_name: z.string().optional(),
                pep: z.number().optional(),
                document_issuance: z.string().optional(),
                document_state: z.string().optional(),
                issuance_date: z.string().optional(),
                nationality: z.string().optional(),
                nationality_state: z.string().optional(),
                marital_status: z.number().optional(),
                birth_date: z.string().optional(),
                gender: z.string().optional(),
                percentual_participacao: z.string().optional(),
                majority: z.boolean().optional(),
                documentos: z
                  .array(
                    z.object({
                      document_type: z.enum([
                        'rg_frente',
                        'rg_verso',
                        'cnh_frente',
                        'cnh_verso',
                        'rne_frente',
                        'rne_verso',
                        'selfie',
                        'comprovante_endereco',
                      ]),
                      file_base64: z.string(),
                      file_name: z.string().optional(),
                      mime_type: z.string().optional(),
                    }),
                  )
                  .optional(),
              }),
            )
            .optional(),
          sync_immediately: z.boolean().default(false),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { customerId } = request.params as { customerId: string }
        const data = request.body as any

        if (data.email || data.phone_number) {
          await db
            .update(customers)
            .set({
              email: data.email,
              phone_number: data.phone_number,
            })
            .where(eq(customers.id, customerId))
        }

        const pjData: any = {}
        if (data.razao_social) pjData.razao_social = data.razao_social
        if (data.nome_fantasia) pjData.nome_fantasia = data.nome_fantasia
        if (data.foundation_date) pjData.foundation_date = data.foundation_date
        if (data.cnae) pjData.cnae = data.cnae
        if (data.cnae_description)
          pjData.cnae_description = data.cnae_description
        if (data.capital_social) pjData.capital_social = data.capital_social

        if (Object.keys(pjData).length > 0) {
          await upsertCustomerPjData(customerId, pjData)
        }

        const addressData: any = {}
        if (data.postal_code) addressData.postal_code = data.postal_code
        if (data.street) addressData.street = data.street
        if (data.number) addressData.number = data.number
        if (data.neighborhood) addressData.neighborhood = data.neighborhood
        if (data.city) addressData.city = data.city
        if (data.state) addressData.state = data.state
        if (data.country) addressData.country = data.country
        if (data.complement) addressData.complement = data.complement

        if (Object.keys(addressData).length > 0) {
          await db
            .update(customers)
            .set(addressData)
            .where(eq(customers.id, customerId))
        }

        if (data.documentos_empresa && data.documentos_empresa.length > 0) {
          for (const doc of data.documentos_empresa) {
            await addCustomerDocument(customerId, doc)
          }
        }

        const sociosIds: string[] = []
        if (data.socios && data.socios.length > 0) {
          for (const socioData of data.socios) {
            const { documentos, ...socioInfo } = socioData
            const socio = await upsertSocio(customerId, socioInfo)
            sociosIds.push(socio.id)

            if (documentos && documentos.length > 0) {
              for (const doc of documentos) {
                await addSocioDocument(socio.id, doc)
              }
            }
          }
        }

        const response: any = {
          success: true,
          message: 'Dados salvos com sucesso',
          data: {
            customer_id: customerId,
            socios_count: sociosIds.length,
          },
        }

        if (data.sync_immediately) {
          try {
            const syncResponse = await syncPjToExternalApi(customerId)
            response.data.sync = {
              status: syncResponse.status,
              message: syncResponse.message,
              pending_fields: syncResponse.pending_fields,
            }
            response.message = 'Dados salvos e enviados para API externa'
          } catch (syncError: any) {
            response.data.sync_error = syncError.message
            response.message =
              'Dados salvos, mas erro ao enviar para API externa. Use /sync para tentar novamente.'
          }
        } else {
          response.message +=
            '. Use POST /onboarding/pj/:customerId/sync para enviar para API externa.'
        }

        return reply.send(response)
      } catch (error: any) {
        console.error('Erro ao processar dados completos', error)
        return reply.code(500).send({
          success: false,
          message: error.message || 'Erro ao processar dados',
        })
      }
    },
  )

  app.get('/onboarding/pj/:customerId', async (request, reply) => {
    try {
      const { customerId } = request.params as { customerId: string }

      const aggregate = await getCustomerPjById(customerId)

      if (!aggregate) {
        return reply.code(404).send({
          success: false,
          message: 'Customer não encontrado',
        })
      }

      return reply.send({
        success: true,
        data: aggregate,
      })
    } catch (error: any) {
      console.error('Erro ao buscar customer', error)
      return reply.code(500).send({
        success: false,
        message: error.message || 'Erro ao buscar customer',
      })
    }
  })
}
