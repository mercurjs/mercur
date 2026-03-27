import { describe, it, expect } from "vitest"

/**
 * Tests for rate limit sliding window logic.
 * The actual rate limiting uses Redis INCR + EXPIRE in validate-rate-limit step.
 * These tests verify the algorithm behavior without Redis.
 */

type RateLimitState = {
  counters: Map<string, { count: number; expiresAt: number }>
}

const MESSAGES_PER_MINUTE = 10
const CONVERSATIONS_PER_HOUR = 5
const MSG_WINDOW_MS = 60_000
const CONV_WINDOW_MS = 3_600_000

function createState(): RateLimitState {
  return { counters: new Map() }
}

function incrementCounter(
  state: RateLimitState,
  key: string,
  windowMs: number,
  now: number
): number {
  const existing = state.counters.get(key)

  if (!existing || existing.expiresAt <= now) {
    // Key expired or doesn't exist — start new window
    state.counters.set(key, { count: 1, expiresAt: now + windowMs })
    return 1
  }

  existing.count++
  return existing.count
}

function checkRateLimit(
  state: RateLimitState,
  senderId: string,
  isNewConversation: boolean,
  now: number
): { allowed: boolean; reason?: string } {
  const msgKey = `ratelimit:msg:${senderId}`
  const msgCount = incrementCounter(state, msgKey, MSG_WINDOW_MS, now)

  if (msgCount > MESSAGES_PER_MINUTE) {
    return { allowed: false, reason: "message_rate_exceeded" }
  }

  if (isNewConversation) {
    const convKey = `ratelimit:conv:${senderId}`
    const convCount = incrementCounter(state, convKey, CONV_WINDOW_MS, now)

    if (convCount > CONVERSATIONS_PER_HOUR) {
      return { allowed: false, reason: "conversation_rate_exceeded" }
    }
  }

  return { allowed: true }
}

describe("Rate Limit Sliding Window", () => {
  describe("message rate limit (10/min)", () => {
    it("allows first message", () => {
      const state = createState()
      const result = checkRateLimit(state, "user_1", false, Date.now())
      expect(result.allowed).toBe(true)
    })

    it("allows up to 10 messages per minute", () => {
      const state = createState()
      const now = Date.now()

      for (let i = 0; i < 10; i++) {
        const result = checkRateLimit(state, "user_1", false, now)
        expect(result.allowed).toBe(true)
      }
    })

    it("blocks 11th message within the minute", () => {
      const state = createState()
      const now = Date.now()

      for (let i = 0; i < 10; i++) {
        checkRateLimit(state, "user_1", false, now)
      }

      const result = checkRateLimit(state, "user_1", false, now)
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe("message_rate_exceeded")
    })

    it("allows messages again after window expires", () => {
      const state = createState()
      const now = Date.now()

      for (let i = 0; i < 10; i++) {
        checkRateLimit(state, "user_1", false, now)
      }

      // After 60 seconds, window resets
      const afterWindow = now + MSG_WINDOW_MS + 1
      const result = checkRateLimit(state, "user_1", false, afterWindow)
      expect(result.allowed).toBe(true)
    })
  })

  describe("conversation rate limit (5/hour)", () => {
    it("allows first new conversation", () => {
      const state = createState()
      const result = checkRateLimit(state, "user_1", true, Date.now())
      expect(result.allowed).toBe(true)
    })

    it("allows up to 5 new conversations per hour", () => {
      const state = createState()
      const now = Date.now()

      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(state, "user_1", true, now)
        expect(result.allowed).toBe(true)
      }
    })

    it("blocks 6th conversation within the hour", () => {
      const state = createState()
      const now = Date.now()

      for (let i = 0; i < 5; i++) {
        checkRateLimit(state, "user_1", true, now)
      }

      const result = checkRateLimit(state, "user_1", true, now)
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe("conversation_rate_exceeded")
    })

    it("allows new conversations after hour window expires", () => {
      const state = createState()
      const now = Date.now()

      for (let i = 0; i < 5; i++) {
        checkRateLimit(state, "user_1", true, now)
      }

      const afterWindow = now + CONV_WINDOW_MS + 1
      const result = checkRateLimit(state, "user_1", true, afterWindow)
      expect(result.allowed).toBe(true)
    })

    it("does not check conversation limit for non-new messages", () => {
      const state = createState()
      const now = Date.now()

      // Exhaust conversation limit
      for (let i = 0; i < 6; i++) {
        checkRateLimit(state, "user_1", true, now)
      }

      // Sending to existing conversation should still work (only msg limit applies)
      const result = checkRateLimit(state, "user_1", false, now)
      expect(result.allowed).toBe(true)
    })
  })

  describe("per-user isolation", () => {
    it("rate limits are per-user", () => {
      const state = createState()
      const now = Date.now()

      // User 1 hits limit
      for (let i = 0; i < 10; i++) {
        checkRateLimit(state, "user_1", false, now)
      }

      // User 1 is blocked
      expect(checkRateLimit(state, "user_1", false, now).allowed).toBe(false)

      // User 2 is still allowed
      expect(checkRateLimit(state, "user_2", false, now).allowed).toBe(true)
    })
  })

  describe("applies to both buyers and sellers", () => {
    it("rate limits apply equally to customers", () => {
      const state = createState()
      const now = Date.now()

      for (let i = 0; i < 10; i++) {
        checkRateLimit(state, "cust_123", false, now)
      }

      expect(checkRateLimit(state, "cust_123", false, now).allowed).toBe(false)
    })

    it("rate limits apply equally to sellers", () => {
      const state = createState()
      const now = Date.now()

      for (let i = 0; i < 10; i++) {
        checkRateLimit(state, "seller_456", false, now)
      }

      expect(checkRateLimit(state, "seller_456", false, now).allowed).toBe(false)
    })
  })

  describe("counter expiry", () => {
    it("counter resets to 1 after window expires", () => {
      const state = createState()
      const now = Date.now()

      checkRateLimit(state, "user_1", false, now)
      checkRateLimit(state, "user_1", false, now)
      checkRateLimit(state, "user_1", false, now)

      const msgKey = "ratelimit:msg:user_1"
      expect(state.counters.get(msgKey)?.count).toBe(3)

      // After window expires, next call starts fresh
      const afterWindow = now + MSG_WINDOW_MS + 1
      checkRateLimit(state, "user_1", false, afterWindow)
      expect(state.counters.get(msgKey)?.count).toBe(1)
    })
  })
})
