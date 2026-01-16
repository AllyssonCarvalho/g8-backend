import {
  authCustomerToken,
  getAppToken,
  individualRegisterStep1,
  userAuth,
} from '@/services/g8.service'
import { setAppToken } from '@/utils/cronos-token'
import { type FastifyInstance } from 'fastify'
import { z } from 'zod'

// Cache simples em memória para armazenar dados do usuário
// Chave: individual_id, Valor: dados do usuário
const userDataCache = new Map<string, any>()

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

      const appTokenResponse = await getAppToken()
      setAppToken(appTokenResponse.data.token)

      const authResponse = await userAuth(document, password)

      const userData = authResponse.data

      // Salvar dados no cache usando individual_id como chave
      if (userData.individual_id) {
        userDataCache.set(userData.individual_id, userData)
      }

      return reply.send({
        success: true,
        data: {
          accessToken: authResponse.data.token, 
          userToken: authResponse.data.token,
        },
      })
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

  app.get('/users/data', async (request, reply) => {
    try {
      const userToken = request.headers.usertoken as string | undefined

      if (!userToken) {
        return reply.code(401).send({
          success: false,
          message: 'Token de usuário não fornecido',
        })
      }

      // Decodificar o JWT para pegar o individual_id
      const jwtParts = userToken.split('.')
      if (jwtParts.length !== 3) {
        return reply.code(401).send({
          success: false,
          message: 'Token inválido',
        })
      }

      const payload = JSON.parse(
        Buffer.from(jwtParts[1], 'base64').toString('utf-8')
      )
      const individualId = payload.sub

      if (!individualId) {
        return reply.code(401).send({
          success: false,
          message: 'Token não contém individual_id',
        })
      }

      // Buscar dados do cache
      const userData = userDataCache.get(individualId)

      if (!userData) {
        return reply.code(404).send({
          success: false,
          message: 'Dados do usuário não encontrados',
        })
      }

      // Mapear os dados para o formato BasicUserData
      const mappedData = {
        name: userData.full_name || '',
        status: mapStatusToUserStatus(userData.status),
        accountNumber: userData.bank_account?.account_number || null,
        accountBranch: userData.bank_account?.agency || null,
        bankNumber: userData.bank_account?.bank_code || null,
        ispb: null,
        taxNumber: userData.document || null,
        email: userData.email || null,
        motherName: null,
        birthDate: userData.birth_date || null,
        formatedBirthDate: userData.birth_date
          ? formatDate(userData.birth_date)
          : null,
        pagouAbertura: null,
      }

      return reply.send(mappedData)
    } catch (error) {
      console.error('Erro ao buscar dados do usuário', error)
      return reply.code(500).send({
        success: false,
        message: 'Erro ao buscar dados do usuário',
      })
    }
  })
}

// Função auxiliar para mapear o status
function mapStatusToUserStatus(status: string): string {
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

// Função auxiliar para formatar data
function formatDate(dateString: string): string {
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
