import { MedusaRequest, MedusaResponse } from "@medusajs/framework"

import { MESSAGING_REDIS_MODULE } from "../../../../modules/messaging-redis"
import type MessagingRedisModuleService from "../../../../modules/messaging-redis/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const token = req.query.token as string | undefined

  if (!token) {
    res.status(401).json({ message: "Missing token" })
    return
  }

  const redisService = req.scope.resolve<MessagingRedisModuleService>(MESSAGING_REDIS_MODULE)

  if (!redisService.isAvailable) {
    res.status(503).json({ message: "Token service unavailable" })
    return
  }

  let customerId: string | null = null

  try {
    customerId = await redisService.consumeToken(token)
  } catch {
    res.status(503).json({ message: "Token service unavailable" })
    return
  }

  if (!customerId) {
    res.status(401).json({ message: "Invalid or expired token" })
    return
  }

  // SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  })
  res.flushHeaders()

  // Heartbeat
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

          // Only deliver events for this buyer
          if (event.recipient_id !== customerId && event.sender_id !== customerId) {
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

    res.write(`event: connected\ndata: {"status":"connected"}\n\n`)

    // Handle Last-Event-ID (sanitize to prevent SSE frame injection)
    const lastEventId = req.query.last_event_id as string | undefined
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
