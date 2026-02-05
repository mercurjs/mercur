import { createClient } from '@mercurjs/client'
import { Routes } from '@mercurjs/core/_generated'
import config from 'virtual:mercur/config'

export const client = createClient<Routes>({
  baseUrl: config.baseUrl,
  fetchOptions: {
    credentials: 'include',
  },
})