import { createClient } from "@mercurjs/client"
import { Routes } from '../../../../.mercur/_generated'

declare const __BACKEND_URL__: string

export const client = createClient<Routes>({
  baseUrl: __BACKEND_URL__,
})
