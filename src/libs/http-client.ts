import axios from 'axios'
import { getAppTokenValue } from '@/utils/cronos-token'


const baseURL = process.env.G8_BASE_URL?.trim()
if (!baseURL) throw new Error('G8_BASE_URL vazio/undefined')
export const http = axios.create({ baseURL })

console.log('[http-client] baseURL =', baseURL)

http.interceptors.request.use((config) => {
  config.headers = config.headers ?? {} 

  const url = config.url ?? ''

  if (url.includes('/v1/application/token')) {
    config.headers.Authorization =
      `Basic ${Buffer.from(
        `${process.env.PUBLIC_KEY}:${process.env.PRIVATE_KEY}`,
      ).toString('base64')}`
    return config
  }

  const token = getAppTokenValue()
  if (token) config.headers.Authorization = `Bearer ${token}`

  return config
})
