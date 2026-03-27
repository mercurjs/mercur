import { LoaderOptions } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MESSAGING_FILTERS_MODULE } from "../index"
import type MessagingFiltersModuleService from "../service"
import { CompiledRuleset } from "../types/common"

let compiledRuleset: CompiledRuleset = {
  exactWords: new Set<string>(),
  exactRules: new Map<string, string>(),
  containsPatterns: [],
  regexPatterns: [],
}

export function getCompiledRuleset(): CompiledRuleset {
  return compiledRuleset
}

export function invalidateRuleset(): void {
  compiledRuleset = {
    exactWords: new Set<string>(),
    exactRules: new Map<string, string>(),
    containsPatterns: [],
    regexPatterns: [],
  }
}

async function compileFilters(container: any): Promise<void> {
  const service = container.resolve(MESSAGING_FILTERS_MODULE) as MessagingFiltersModuleService

  const rules = await service.listFilterRules(
    { is_enabled: true },
    { take: 1000 }
  )

  const newRuleset: CompiledRuleset = {
    exactWords: new Set<string>(),
    exactRules: new Map<string, string>(),
    containsPatterns: [],
    regexPatterns: [],
  }

  for (const rule of rules) {
    switch (rule.match_type) {
      case "exact": {
        const lowered = rule.pattern.toLowerCase()
        newRuleset.exactWords.add(lowered)
        newRuleset.exactRules.set(lowered, rule.id)
        break
      }
      case "contains": {
        newRuleset.containsPatterns.push({
          id: rule.id,
          pattern: rule.pattern.toLowerCase(),
        })
        break
      }
      case "regex": {
        try {
          const regex = new RegExp(rule.pattern, "i")
          // ReDoS protection: test with a probe string under a time budget
          const probeStart = Date.now()
          regex.test("a".repeat(50))
          if (Date.now() - probeStart > 10) {
            // Pattern took >10ms on a short string — likely catastrophic backtracking
            const logger = container.resolve?.(ContainerRegistrationKeys.LOGGER)
            logger?.warn(`[messaging] Skipping ReDoS-prone regex rule ${rule.id}: ${rule.pattern}`)
            break
          }
          newRuleset.regexPatterns.push({
            id: rule.id,
            regex,
          })
        } catch {
          // Skip invalid regex patterns
        }
        break
      }
    }
  }

  compiledRuleset = newRuleset
}

export async function recompileFilters(container: any): Promise<void> {
  await compileFilters(container)
}

export default async function compileFiltersLoader({
  container,
}: LoaderOptions): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    await compileFilters(container)
    logger.info(
      `[messaging] Compiled ${compiledRuleset.exactWords.size} exact, ${compiledRuleset.containsPatterns.length} contains, ${compiledRuleset.regexPatterns.length} regex filter rules`
    )
  } catch (error) {
    logger.warn(
      `[messaging] Failed to compile filter rules on startup: ${error}`
    )
  }

  // Subscribe to Redis filter_rules_changed channel for cross-instance invalidation
  try {
    const { MESSAGING_REDIS_MODULE } = await import("../../messaging-redis")
    const redisService = container.resolve(MESSAGING_REDIS_MODULE) as any
    const subscriber = redisService.createSubscriber?.()

    if (subscriber) {
      await subscriber.subscribe("filter_rules_changed")
      subscriber.on("message", async (channel: string) => {
        if (channel === "filter_rules_changed") {
          logger.info("[messaging] Filter rules changed — recompiling")
          await compileFilters(container)
        }
      })
    }
  } catch (error) {
    logger.warn(
      `[messaging] Failed to subscribe to filter invalidation channel: ${error}`
    )
  }
}
