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
  const sellerId = req.auth_context.actor_id
  const redisService = req.scope.resolve<MessagingRedisModuleService>(MESSAGING_REDIS_MODULE)

  // SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  })
  res.flushHeaders()

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(":heartbeat\n\n")
  }, 30000)

  let subscriber: ReturnType<MessagingRedisModuleService["createSubscriber"]> = null

  try {
    subscriber = redisService.createSubscriber()

    if (subscriber) {
      await subscriber.subscribe("messaging")

      subscriber.on("message", (_channel: string, message: string) => {
        try {
          const event = JSON.parse(message)

          // Only deliver events for this vendor
          if (event.recipient_id !== sellerId && event.sender_id !== sellerId) {
            return
          }

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

    // Send initial connection event
    res.write(`event: connected\ndata: {"status":"connected"}\n\n`)

    // Handle Last-Event-ID for reconnection (sanitize to prevent SSE frame injection)
    const lastEventId = req.headers["last-event-id"] as string | undefined
    if (lastEventId) {
      const sanitized = lastEventId.replace(/[\n\r]/g, "")
      res.write(`event: reconnected\ndata: ${JSON.stringify({ last_event_id: sanitized })}\n\n`)
    }
  } catch {
    // Redis unavailable, connection will close
  }

  // Cleanup on disconnect
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
