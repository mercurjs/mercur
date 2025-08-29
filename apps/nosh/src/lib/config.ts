import Constants from "expo-constants"

export interface MedusaEnvConfig {
  baseUrl: string
  publishableKey: string
}

const extra = (Constants?.expoConfig?.extra || {}) as Record<string, unknown>

export const medusaEnv: MedusaEnvConfig = {
  baseUrl: (extra.MEDUSA_BASE_URL as string) || "",
  publishableKey: (extra.MEDUSA_PUBLISHABLE_KEY as string) || "",
}

export function assertMedusaEnv(): void {
  if (!medusaEnv.baseUrl) throw new Error("Missing Medusa base URL. Set EXPO_PUBLIC_MEDUSA_BASE_URL or app.json extra MEDUSA_BASE_URL.")
  if (!medusaEnv.publishableKey) {
    // In storefronts publishableKey is required per docs
    // https://docs.medusajs.com/resources/js-sdk
    console.warn("Medusa publishable key is empty. Set MEDUSA_PUBLISHABLE_KEY in .env or app.config.ts extra.")
  }
}


