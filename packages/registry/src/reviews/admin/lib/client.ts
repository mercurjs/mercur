import { createClient } from "@mercurjs/client"
import { Routes } from '../../../../.mercur/_generated'

declare const __BACKEND_URL__: string

const client = createClient<Routes>({
  baseUrl: __BACKEND_URL__,
})

export { client }
