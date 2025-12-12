import axios from 'axios'

export const http = axios.create({
  baseURL: process.env.CRONOS_BASE_URL,
  headers: {
    Authorization: `Basic ${Buffer
      .from(`${process.env.PUBLIC_KEY}:${process.env.PRIVATE_KEY}`)
      .toString('base64')}`,
  },
})