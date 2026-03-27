import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"

import { MESSAGING_REDIS_MODULE } from "../../../../modules/messaging-redis"
import type MessagingRedisModuleService from "../../../../modules/messaging-redis/service"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const redisService = req.scope.resolve<MessagingRedisModuleService>(MESSAGING_REDIS_MODULE)

  // SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  })
  res.flushHeaders()

  const heartbeat = setInterval(() => {
    res.write(":heartbeat\n\n")
  }, 30000)

  let subscriber: ReturnType<MessagingRedisModuleService["createSubscriber"]> = null

  try {
    subscriber = redisService.createSubscriber()

    if (subscriber) {
      await subscriber.subscribe("messaging")

      // Admin receives ALL messaging events (no filtering)
      subscriber.on("message", (_channel: string, message: string) => {
        try {
          const event = JSON.parse(message)
          const eventId = event.message_id || `evt_${Date.now()}`
          const eventType = event.event_type || "message"

          res.write(`id: ${eventId}\n`)
          res.write(`event: ${eventType}\n`)
          res.write(`data: ${JSON.stringify(event)}\n\n`)
        } catch {
          // Skip malformed events
        }
      })
    }

    res.write(`event: connected\ndata: {"status":"connected"}\n\n`)

    // Sanitize Last-Event-ID to prevent SSE frame injection
    const lastEventId = req.headers["last-event-id"] as string | undefined
    if (lastEventId) {
      const sanitized = lastEventId.replace(/[\n\r]/g, "")
      res.write(`event: reconnected\ndata: ${JSON.stringify({ last_event_id: sanitized })}\n\n`)
    }
  } catch {
    // Redis unavailable
  }

  req.on("close", async () => {
    clearInterval(heartbeat)
    if (subscriber) {
      try {
        subscriber.unsubscribe("messaging")
        subscriber.quit()
      } catch {
        // Best effort cleanup
      }
    }
  })
}
