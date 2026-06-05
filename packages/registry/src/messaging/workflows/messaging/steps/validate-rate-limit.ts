import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"

import { MESSAGING_REDIS_MODULE } from "../../../modules/messaging-redis"
import type MessagingRedisModuleService from "../../../modules/messaging-redis/service"
import { MESSAGING_MODULE } from "../../../modules/messaging"
import type MessagingModuleService from "../../../modules/messaging/service"

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

    const messagingService = container.resolve<MessagingModuleService>(MESSAGING_MODULE)
    const rateLimits = messagingService.getOptions().rateLimits

    try {
      const msgResult = await redisService.checkRateLimit(
        `ratelimit:msg:${input.sender_id}`,
        rateLimits.messagesPerMinute,
        60
      )

      if (!msgResult.allowed) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "You are sending messages too quickly. Please wait a moment and try again."
        )
      }

      if (input.is_new_conversation) {
        const convResult = await redisService.checkRateLimit(
          `ratelimit:conv:${input.sender_id}`,
          rateLimits.conversationsPerHour,
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
