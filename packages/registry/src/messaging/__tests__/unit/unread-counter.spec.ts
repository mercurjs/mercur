import { describe, it, expect } from "vitest"

/**
 * Tests for unread counter logic.
 * The actual counter operations happen in MessagingModuleService.createMessageAtomic()
 * and markMessagesReadAtomic(). These tests verify the logic rules:
 *
 * - Increment recipient counter when message from other party
 * - Do NOT increment sender's own counter
 * - Reset counter to 0 on mark read
 * - Reconciliation corrects drift
 */

type CounterState = {
  unread_count_customer: number
  unread_count_seller: number
}

function simulateSendMessage(
  state: CounterState,
  senderType: "customer" | "seller"
): CounterState {
  // Only the recipient's counter increments
  if (senderType === "customer") {
    return {
      ...state,
      unread_count_seller: state.unread_count_seller + 1,
    }
  } else {
    return {
      ...state,
      unread_count_customer: state.unread_count_customer + 1,
    }
  }
}

function simulateMarkRead(
  state: CounterState,
  readerType: "customer" | "seller"
): CounterState {
  if (readerType === "customer") {
    return { ...state, unread_count_customer: 0 }
  } else {
    return { ...state, unread_count_seller: 0 }
  }
}

function simulateReconcile(
  state: CounterState,
  actualUnreadCustomer: number,
  actualUnreadSeller: number
): { state: CounterState; corrected: boolean } {
  const corrected =
    state.unread_count_customer !== actualUnreadCustomer ||
    state.unread_count_seller !== actualUnreadSeller

  return {
    state: {
      unread_count_customer: actualUnreadCustomer,
      unread_count_seller: actualUnreadSeller,
    },
    corrected,
  }
}

describe("Unread Counter Logic", () => {
  const initial: CounterState = {
    unread_count_customer: 0,
    unread_count_seller: 0,
  }

  describe("increment on message from other party", () => {
    it("increments seller counter when customer sends message", () => {
      const result = simulateSendMessage(initial, "customer")
      expect(result.unread_count_seller).toBe(1)
      expect(result.unread_count_customer).toBe(0) // sender's counter unchanged
    })

    it("increments customer counter when seller sends message", () => {
      const result = simulateSendMessage(initial, "seller")
      expect(result.unread_count_customer).toBe(1)
      expect(result.unread_count_seller).toBe(0) // sender's counter unchanged
    })

    it("accumulates unread count across multiple messages", () => {
      let state = initial
      state = simulateSendMessage(state, "customer") // seller: 1
      state = simulateSendMessage(state, "customer") // seller: 2
      state = simulateSendMessage(state, "customer") // seller: 3

      expect(state.unread_count_seller).toBe(3)
      expect(state.unread_count_customer).toBe(0)
    })
  })

  describe("no increment on own message", () => {
    it("does not increment sender's own counter", () => {
      let state = initial
      state = simulateSendMessage(state, "customer")
      // Customer sends message — customer's own counter stays 0
      expect(state.unread_count_customer).toBe(0)

      state = simulateSendMessage(state, "seller")
      // Seller sends message — seller's own counter stays at 1 (from buyer's message)
      expect(state.unread_count_seller).toBe(1)
    })
  })

  describe("reset on mark read", () => {
    it("resets customer counter to 0 when customer reads", () => {
      let state = initial
      state = simulateSendMessage(state, "seller") // customer: 1
      state = simulateSendMessage(state, "seller") // customer: 2

      state = simulateMarkRead(state, "customer")
      expect(state.unread_count_customer).toBe(0)
    })

    it("resets seller counter to 0 when seller reads", () => {
      let state = initial
      state = simulateSendMessage(state, "customer") // seller: 1
      state = simulateSendMessage(state, "customer") // seller: 2
      state = simulateSendMessage(state, "customer") // seller: 3

      state = simulateMarkRead(state, "seller")
      expect(state.unread_count_seller).toBe(0)
    })

    it("does not affect other party's counter", () => {
      let state = initial
      state = simulateSendMessage(state, "customer") // seller: 1
      state = simulateSendMessage(state, "seller") // customer: 1

      state = simulateMarkRead(state, "customer")
      expect(state.unread_count_customer).toBe(0)
      expect(state.unread_count_seller).toBe(1) // seller's counter unchanged
    })
  })

  describe("reconciliation correction", () => {
    it("corrects drifted counter", () => {
      const drifted: CounterState = {
        unread_count_customer: 5,
        unread_count_seller: 3,
      }

      const { state, corrected } = simulateReconcile(drifted, 2, 1)
      expect(corrected).toBe(true)
      expect(state.unread_count_customer).toBe(2)
      expect(state.unread_count_seller).toBe(1)
    })

    it("does not flag correction when counts match", () => {
      const correct: CounterState = {
        unread_count_customer: 2,
        unread_count_seller: 1,
      }

      const { corrected } = simulateReconcile(correct, 2, 1)
      expect(corrected).toBe(false)
    })

    it("corrects zero drift", () => {
      const drifted: CounterState = {
        unread_count_customer: 0,
        unread_count_seller: 2,
      }

      const { state, corrected } = simulateReconcile(drifted, 0, 0)
      expect(corrected).toBe(true)
      expect(state.unread_count_seller).toBe(0)
    })
  })

  describe("full conversation flow", () => {
    it("handles typical back-and-forth conversation", () => {
      let state = initial

      // Buyer sends 3 messages
      state = simulateSendMessage(state, "customer")
      state = simulateSendMessage(state, "customer")
      state = simulateSendMessage(state, "customer")
      expect(state.unread_count_seller).toBe(3)
      expect(state.unread_count_customer).toBe(0)

      // Seller reads and replies
      state = simulateMarkRead(state, "seller")
      expect(state.unread_count_seller).toBe(0)

      state = simulateSendMessage(state, "seller")
      expect(state.unread_count_customer).toBe(1)

      // Buyer reads
      state = simulateMarkRead(state, "customer")
      expect(state.unread_count_customer).toBe(0)
      expect(state.unread_count_seller).toBe(0)
    })
  })
})
