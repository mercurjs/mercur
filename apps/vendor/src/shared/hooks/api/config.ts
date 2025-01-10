import { Api } from '@mercurjs/http-client'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000'

export const api = new Api({
  baseUrl: BACKEND_URL,
  baseApiParams: { credentials: 'include' }
})
