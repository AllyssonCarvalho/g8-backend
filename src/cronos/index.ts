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

export const authCustomerToken = async (pub: string, secret: string) => {
  try {
    const response = await http.post('/v1/user/authtoken', { pub, secret })
    return response
  } catch (error) {
    console.error("Erro ao autenticar customer", error)
    throw error
  }
}

export const registerUser = async ({ document }: { document: string }) => {
  try {
    const response = await http.post('/v1/register/individual', { document })
    return response
  } catch (error) {
    console.error("Erro ao registrar usuário", error)
    throw error
  }
}
