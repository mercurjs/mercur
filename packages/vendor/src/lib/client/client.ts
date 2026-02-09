import { createClient, InferClient } from '@mercurjs/client'
import { Routes } from '@mercurjs/core/_generated'
import config from 'virtual:mercur/config'

export const sdk: InferClient<Routes> = createClient<Routes>({
  baseUrl: config.baseUrl,
  fetchOptions: {
    credentials: 'include',
  },
})
