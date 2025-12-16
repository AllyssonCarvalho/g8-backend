import axios from 'axios'
import { getAppTokenValue } from '@/utils/cronos-token'

export const http = axios.create({
  baseURL: process.env.G8_BASE_URL,
})

// Interceptor para colocar o Bearer dinamicamente
http.interceptors.request.use((config) => {
  const token = getAppTokenValue()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    config.headers.Authorization = `Basic ${Buffer.from(
      `${process.env.PUBLIC_KEY}:${process.env.PRIVATE_KEY}`,
    ).toString('base64')}`
  }

  return config
})
