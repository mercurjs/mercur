import { MedusaService } from "@medusajs/framework/utils"

import { FilterRule } from "./models/filter-rule"
import { BlockedMessageLog } from "./models/blocked-message-log"
import {
  CompiledRuleset,
  FilterEvaluationResult,
} from "./types/common"

class MessagingFiltersModuleService extends MedusaService({
  FilterRule,
  BlockedMessageLog,
}) {
  evaluateMessage(
    body: string,
    ruleset: CompiledRuleset
  ): FilterEvaluationResult {
    const lowercasedBody = body.toLowerCase()
    const words = lowercasedBody.split(/\s+/)

    // 1. Exact word match — O(1) per word via hash set
    for (const word of words) {
      if (ruleset.exactWords.has(word)) {
        const ruleId = ruleset.exactRules.get(word)
        return {
          matched: true,
          rule_id: ruleId,
          match_type: "exact",
          pattern: word,
        }
      }
    }

    // 2. Contains/substring match — O(n) per pattern
    for (const entry of ruleset.containsPatterns) {
      if (lowercasedBody.includes(entry.pattern)) {
        return {
          matched: true,
          rule_id: entry.id,
          match_type: "contains",
          pattern: entry.pattern,
        }
      }
    }

    // 3. Regex match (built-in only) — O(n) per pattern
    for (const entry of ruleset.regexPatterns) {
      if (entry.regex.test(body)) {
        return {
          matched: true,
          rule_id: entry.id,
          match_type: "regex",
          pattern: entry.regex.source,
        }
      }
    }

    return { matched: false }
  }
}

export default MessagingFiltersModuleService
