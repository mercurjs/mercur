import { Logger } from "@medusajs/framework/types"

import { isTelemetryDebug, telemetryHost, TELEMETRY_REQUEST_TIMEOUT_MS } from "./config"

/**
 * The proxy swaps this for the real project key, so no PostHog credential
 * ships inside the package.
 */
const PLACEHOLDER_API_KEY = "mercur"

export type TelemetryEvent = {
  event: string
  distinct_id: string
  properties: Record<string, unknown>
  timestamp?: string
}

export type TelemetrySender = {
  capture: (events: TelemetryEvent[]) => Promise<void>
}

type SenderOptions = {
  logger?: Logger
  env?: NodeJS.ProcessEnv
  fetchImpl?: typeof fetch
}

export function createTelemetrySender({
  logger,
  env = process.env,
  fetchImpl = fetch,
}: SenderOptions = {}): TelemetrySender {
  const url = `${telemetryHost(env)}/batch`
  const debug = isTelemetryDebug(env)

  return {
    async capture(events) {
      if (!events.length) return

      const body = {
        api_key: PLACEHOLDER_API_KEY,
        batch: events.map((event) => ({
          ...event,
          timestamp: event.timestamp ?? new Date().toISOString(),
          properties: { ...event.properties, $geoip_disable: true },
        })),
      }

      if (debug) {
        logger?.info(`[telemetry] ${JSON.stringify(body.batch, null, 2)}`)
        return
      }

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), TELEMETRY_REQUEST_TIMEOUT_MS)
      try {
        await fetchImpl(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        })
      } catch (error) {
        logger?.debug(`[telemetry] send failed: ${(error as Error)?.message}`)
      } finally {
        clearTimeout(timer)
      }
    },
  }
}
