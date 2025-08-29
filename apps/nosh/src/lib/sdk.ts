import { Medusa } from "@medusajs/js-sdk"
import type { MedusaClient } from "@medusajs/js-sdk"
import { medusaEnv, assertMedusaEnv } from "./config"
import { createAsyncStorageAdapter } from "./medusa-storage"

let sdkSingleton: MedusaClient | null = null

export function getMedusaClient(): MedusaClient {
  if (sdkSingleton) return sdkSingleton

  assertMedusaEnv()

  const storage = createAsyncStorageAdapter()

  sdkSingleton = new Medusa({
    baseUrl: medusaEnv.baseUrl,
    publishableKey: medusaEnv.publishableKey,
    auth: {
      type: "jwt",
      jwtTokenStorageMethod: "custom",
      storage,
      jwtTokenStorageKey: "token",
    },
    // Example of global headers hook from docs
    // https://docs.medusajs.com/resources/js-sdk#pass-headers-in-requests
    globalHeaders: {},
    debug: false,
  })

  return sdkSingleton
}

export const sdk = getMedusaClient()


