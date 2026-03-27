import { describe, it, expect } from "vitest"
import type {
  CompiledRuleset,
  FilterEvaluationResult,
} from "../../modules/messaging-filters/types/common"

/**
 * Standalone evaluation function matching the logic in MessagingFiltersModuleService.evaluateMessage()
 * This allows testing the filter evaluation algorithm without instantiating the full service.
 */
function evaluateMessage(
  body: string,
  ruleset: CompiledRuleset
): FilterEvaluationResult {
  const lowercasedBody = body.toLowerCase()
  const words = lowercasedBody.split(/\s+/)

  // 1. Exact word match
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

  // 2. Contains match
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

  // 3. Regex match
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

function createEmptyRuleset(): CompiledRuleset {
  return {
    exactWords: new Set<string>(),
    exactRules: new Map<string, string>(),
    containsPatterns: [],
    regexPatterns: [],
  }
}

describe("Content Filter Evaluation", () => {
  describe("Exact match", () => {
    it("matches exact word (case-insensitive)", () => {
      const ruleset = createEmptyRuleset()
      ruleset.exactWords.add("spam")
      ruleset.exactRules.set("spam", "filt_001")

      const result = evaluateMessage("This is SPAM content", ruleset)
      expect(result.matched).toBe(true)
      expect(result.rule_id).toBe("filt_001")
      expect(result.match_type).toBe("exact")
    })

    it("does not match partial words for exact match", () => {
      const ruleset = createEmptyRuleset()
      ruleset.exactWords.add("spam")
      ruleset.exactRules.set("spam", "filt_001")

      // "spammer" should NOT match exact "spam"
      const result = evaluateMessage("He is a spammer", ruleset)
      expect(result.matched).toBe(false)
    })

    it("matches when word is at beginning/end of message", () => {
      const ruleset = createEmptyRuleset()
      ruleset.exactWords.add("badword")
      ruleset.exactRules.set("badword", "filt_002")

      expect(evaluateMessage("badword is here", ruleset).matched).toBe(true)
      expect(evaluateMessage("here is badword", ruleset).matched).toBe(true)
    })
  })

  describe("Contains match", () => {
    it("matches substring (case-insensitive)", () => {
      const ruleset = createEmptyRuleset()
      ruleset.containsPatterns.push({ id: "filt_010", pattern: "buy now" })

      const result = evaluateMessage("You should BUY NOW at discount", ruleset)
      expect(result.matched).toBe(true)
      expect(result.rule_id).toBe("filt_010")
      expect(result.match_type).toBe("contains")
    })

    it("matches when pattern appears inside a word", () => {
      const ruleset = createEmptyRuleset()
      ruleset.containsPatterns.push({ id: "filt_011", pattern: "crypto" })

      const result = evaluateMessage("Check cryptocurrency prices", ruleset)
      expect(result.matched).toBe(true)
    })

    it("does not match when pattern is absent", () => {
      const ruleset = createEmptyRuleset()
      ruleset.containsPatterns.push({ id: "filt_012", pattern: "scam" })

      const result = evaluateMessage("This is a legitimate offer", ruleset)
      expect(result.matched).toBe(false)
    })
  })

  describe("Regex match (built-in patterns)", () => {
    it("matches email addresses", () => {
      const ruleset = createEmptyRuleset()
      ruleset.regexPatterns.push({
        id: "filt_builtin_email",
        regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i,
      })

      const result = evaluateMessage("Contact me at user@example.com", ruleset)
      expect(result.matched).toBe(true)
      expect(result.rule_id).toBe("filt_builtin_email")
      expect(result.match_type).toBe("regex")
    })

    it("matches phone numbers", () => {
      const ruleset = createEmptyRuleset()
      ruleset.regexPatterns.push({
        id: "filt_builtin_phone",
        regex: /(\+?\d{1,3}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/i,
      })

      const result = evaluateMessage("Call me at +1-555-123-4567", ruleset)
      expect(result.matched).toBe(true)
    })

    it("matches URLs", () => {
      const ruleset = createEmptyRuleset()
      ruleset.regexPatterns.push({
        id: "filt_builtin_url",
        regex: /https?:\/\/[^\s]+|www\.[^\s]+/i,
      })

      expect(
        evaluateMessage("Visit https://example.com", ruleset).matched
      ).toBe(true)
      expect(
        evaluateMessage("Go to www.example.com", ruleset).matched
      ).toBe(true)
    })

    it("does not match clean messages", () => {
      const ruleset = createEmptyRuleset()
      ruleset.regexPatterns.push({
        id: "filt_builtin_email",
        regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i,
      })

      const result = evaluateMessage("Is this product available in blue?", ruleset)
      expect(result.matched).toBe(false)
    })
  })

  describe("Priority and short-circuit", () => {
    it("exact match takes priority over contains", () => {
      const ruleset = createEmptyRuleset()
      ruleset.exactWords.add("spam")
      ruleset.exactRules.set("spam", "filt_exact")
      ruleset.containsPatterns.push({ id: "filt_contains", pattern: "spam" })

      const result = evaluateMessage("This is spam", ruleset)
      expect(result.rule_id).toBe("filt_exact")
      expect(result.match_type).toBe("exact")
    })

    it("contains takes priority over regex", () => {
      const ruleset = createEmptyRuleset()
      ruleset.containsPatterns.push({ id: "filt_contains", pattern: "user@" })
      ruleset.regexPatterns.push({
        id: "filt_regex",
        regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i,
      })

      const result = evaluateMessage("Contact user@example.com", ruleset)
      expect(result.rule_id).toBe("filt_contains")
      expect(result.match_type).toBe("contains")
    })

    it("short-circuits on first match (does not check all rules)", () => {
      const ruleset = createEmptyRuleset()
      ruleset.exactWords.add("spam")
      ruleset.exactRules.set("spam", "filt_first")
      ruleset.exactWords.add("virus")
      ruleset.exactRules.set("virus", "filt_second")

      // "spam" appears as first matching word
      const result = evaluateMessage("spam virus", ruleset)
      expect(result.matched).toBe(true)
      expect(result.rule_id).toBe("filt_first")
    })
  })

  describe("Empty ruleset", () => {
    it("passes all messages when ruleset is empty", () => {
      const ruleset = createEmptyRuleset()

      expect(evaluateMessage("Buy now! Contact user@test.com", ruleset).matched).toBe(false)
      expect(evaluateMessage("Call +1-555-0000", ruleset).matched).toBe(false)
      expect(evaluateMessage("Visit https://evil.com", ruleset).matched).toBe(false)
    })
  })

  describe("Edge cases", () => {
    it("handles empty message body", () => {
      const ruleset = createEmptyRuleset()
      ruleset.exactWords.add("spam")
      ruleset.exactRules.set("spam", "filt_001")

      const result = evaluateMessage("", ruleset)
      expect(result.matched).toBe(false)
    })

    it("handles message with only whitespace", () => {
      const ruleset = createEmptyRuleset()
      ruleset.exactWords.add("spam")
      ruleset.exactRules.set("spam", "filt_001")

      const result = evaluateMessage("   \n\t  ", ruleset)
      expect(result.matched).toBe(false)
    })

    it("handles unicode characters", () => {
      const ruleset = createEmptyRuleset()
      ruleset.containsPatterns.push({ id: "filt_emoji", pattern: "🔥sale" })

      const result = evaluateMessage("Check this 🔥sale out!", ruleset)
      expect(result.matched).toBe(true)
    })
  })
})
