import { createClient, InferClient } from "@mercurjs/client"
import { Routes } from '../../../../.mercur/_generated'

declare const __BACKEND_URL__: string

export const client: InferClient<Routes> = createClient({
  baseUrl: __BACKEND_URL__,
})
