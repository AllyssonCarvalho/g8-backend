import {
  authCustomerToken,
  getAppToken,
  individualRegisterStep1,
  userAuth,
} from '@/services/g8.service'
import { setAppToken } from '@/utils/cronos-token'
import { type FastifyInstance } from 'fastify'
import { z } from 'zod'


export const userDataCache = new Map<string, any>()

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

  app.post('/login', async (request, reply) => {
    try {
      const loginSchema = z.object({
        document: z.string().min(11).max(14),
        password: z.string().min(1),
      })

      const { document, password } = loginSchema.parse(request.body)

      console.log('[BACKEND] Login request received:', {
        document: document.substring(0, 3) + '***', // Log parcial do documento por segurança
        documentLength: document.length,
      })

      const appTokenResponse = await getAppToken()
      setAppToken(appTokenResponse.data.token)

      const authResponse = await userAuth(document, password)

      const userData = authResponse.data

      console.log('[BACKEND] API Cronos response:', {
        success: userData.success,
        individual_id: userData.individual_id,
        status: userData.status,
        full_name: userData.full_name,
        email: userData.email,
        hasToken: !!authResponse.data.token,
      })

      if (userData.individual_id) {
        userDataCache.set(userData.individual_id, userData)
        console.log('[BACKEND] User data cached with individual_id:', userData.individual_id)
      }

      const responseData = {
        success: true,
        data: {
          accessToken: authResponse.data.token, 
          userToken: authResponse.data.token,
        },
      }

      console.log('[BACKEND] Sending login response:', {
        success: responseData.success,
        hasAccessToken: !!responseData.data.accessToken,
        hasUserToken: !!responseData.data.userToken,
      })

      return reply.send(responseData)
    } catch (error) {
      console.error('Erro ao fazer login', error)

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          message: 'Dados inválidos',
          errors: error.flatten().fieldErrors,
        })
      }

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any
        const status = axiosError.response?.status || 500
        const message = axiosError.response?.data?.message || 'Erro ao fazer login'

        return reply.code(status).send({
          success: false,
          message: message,
        })
      }

      return reply.code(500).send({
        success: false,
        message: 'Erro ao fazer login',
      })
    }
  })

}

export function mapStatusToUserStatus(status: string): string {
  const statusMap: Record<string, string> = {
    ativa: 'CONTA_APROVADA',
    ativo: 'CONTA_APROVADA',
    'aguardando pagamento': 'AGUARDANDO_PAGAMENTO',
    'aguardando aprovação': 'AGUARDANDO_APROVACAO_INTERNA',
    'aguardando reenvio': 'AGUARDANDO_REENVIO_DE_DADOS',
    reprovada: 'CONTA_REPROVADA',
    reprovado: 'CONTA_REPROVADA',
  }

  const normalizedStatus = status?.toLowerCase() || ''
  return statusMap[normalizedStatus] || 'ESTADO_DESCONHECIDO'
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return dateString
  }
}
