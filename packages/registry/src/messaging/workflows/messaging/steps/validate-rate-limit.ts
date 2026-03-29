import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"

import { MESSAGING_REDIS_MODULE } from "../../../modules/messaging-redis"
import type MessagingRedisModuleService from "../../../modules/messaging-redis/service"

type ValidateRateLimitInput = {
  sender_id: string
  is_new_conversation: boolean
}

export const validateRateLimitStep = createStep(
  "validate-rate-limit",
  async (input: ValidateRateLimitInput, { container }) => {
    let redisService: MessagingRedisModuleService

    try {
      redisService = container.resolve<MessagingRedisModuleService>(MESSAGING_REDIS_MODULE)
    } catch {
      // Module not registered — skip rate limiting gracefully
      return new StepResponse(undefined)
    }

    if (!redisService.isAvailable) {
      return new StepResponse(undefined)
    }

    try {
      // Check message rate limit: 20 per minute
      const msgResult = await redisService.checkRateLimit(
        `ratelimit:msg:${input.sender_id}`,
        20,
        60
      )

      if (!msgResult.allowed) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "You are sending messages too quickly. Please wait a moment and try again."
        )
      }

      // Check conversation creation rate limit: 5 per hour
      if (input.is_new_conversation) {
        const convResult = await redisService.checkRateLimit(
          `ratelimit:conv:${input.sender_id}`,
          5,
          3600
        )

        if (!convResult.allowed) {
          throw new MedusaError(
            MedusaError.Types.NOT_ALLOWED,
            "You are sending messages too quickly. Please wait a moment and try again."
          )
        }
      }
    } catch (err) {
      if (err instanceof MedusaError) {
        throw err
      }
      // Redis operation failed — skip rate limiting gracefully
    }

    return new StepResponse(undefined)
  }
)
