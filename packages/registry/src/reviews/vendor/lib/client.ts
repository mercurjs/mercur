import { createClient } from "@mercurjs/client"

declare const __BACKEND_URL__: string

export const client = createClient({
  baseUrl: __BACKEND_URL__,
})
