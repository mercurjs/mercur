import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { MESSAGING_REDIS_MODULE } from "../../../modules/messaging-redis"
import type MessagingRedisModuleService from "../../../modules/messaging-redis/service"
import { invalidateRuleset, recompileFilters } from "../../../modules/messaging-filters/loaders/compile-filters"

export const invalidateFilterCacheStep = createStep(
  "invalidate-filter-cache",
  async (_input: undefined, { container }) => {
    // Recompile locally
    await recompileFilters(container)

    // Notify other instances via Redis pub/sub
    try {
      const redisService = container.resolve<MessagingRedisModuleService>(MESSAGING_REDIS_MODULE)
      await redisService.publish("filter_rules_changed", { invalidated: true })
    } catch {
      // Best-effort cross-instance invalidation
    }

    return new StepResponse(undefined)
  }
)
