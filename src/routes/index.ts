import { type FastifyInstance } from 'fastify'
import { authRoutes } from './auth.routes'
import { onboardingPjRoutes } from './onboarding-pj.routes'
import { onboardingRoutes } from './onboarding-pf.routes'

export async function registerRoutes(app: FastifyInstance) {

  app.register(authRoutes, { prefix: '/auth' })
  
  app.get('/token', async (request, reply) => {
    const { getAppToken } = await import('@/services/g8.service')
    const { setAppToken } = await import('@/utils/cronos-token')
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
  
  app.get('/api/users/data', async (request, reply) => {
    const { userDataCache, mapStatusToUserStatus, formatDate } = await import('./auth.routes')
    
    try {
      const userToken = request.headers.usertoken as string | undefined

      if (!userToken) {
        return reply.code(401).send({
          success: false,
          message: 'Token de usuário não fornecido',
        })
      }

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

      const userData = userDataCache.get(individualId)

      if (!userData) {
        return reply.code(404).send({
          success: false,
          message: 'Dados do usuário não encontrados',
        })
      }

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

  app.register(onboardingPjRoutes)
  app.register(onboardingRoutes)
}
