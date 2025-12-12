import { http } from '@/lib/http-client'

export const getAppToken = async () => {
  try {
    const response = await http.get('/v1/application/token')
    return response
  } catch (error) {
    console.error("Erro ao chamar API externa", error)
    throw error
  }
}
