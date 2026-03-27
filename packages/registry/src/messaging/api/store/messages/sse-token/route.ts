import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { randomUUID } from "crypto"

import { MESSAGING_REDIS_MODULE } from "../../../../modules/messaging-redis"
import type MessagingRedisModuleService from "../../../../modules/messaging-redis/service"

const SSE_TOKEN_TTL_SECONDS = 30

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const customerId = req.auth_context.actor_id
  const redisService = req.scope.resolve<MessagingRedisModuleService>(MESSAGING_REDIS_MODULE)

  if (!redisService.isAvailable) {
    res.status(503).json({ message: "Token service unavailable" })
    return
  }

  const token = randomUUID()

  try {
    await redisService.setToken(token, customerId, SSE_TOKEN_TTL_SECONDS)
  } catch {
    res.status(503).json({ message: "Token service unavailable" })
    return
  }

  res.json({ token, expires_in: SSE_TOKEN_TTL_SECONDS })
}
