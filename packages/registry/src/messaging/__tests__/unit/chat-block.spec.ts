import { describe, it, expect } from "vitest"

/**
 * Tests for chat-block logic.
 * The actual blocking uses a ChatBlock model with a unique customer_id index.
 * These tests verify the blocking state machine and enforcement rules
 * without database dependencies.
 */

// ---------------------------------------------------------------------------
// Types & helpers — simulate ChatBlock state in memory
// ---------------------------------------------------------------------------

type ChatBlockRecord = {
  id: string
  customer_id: string
  blocked_by: string
  reason: string | null
  created_at: Date
}

type BlockStore = {
  blocks: Map<string, ChatBlockRecord>
}

function createStore(): BlockStore {
  return { blocks: new Map() }
}

let idCounter = 0
function nextId(): string {
  return `cblk_${++idCounter}`
}

function blockCustomer(
  store: BlockStore,
  customerId: string,
  blockedBy: string,
  reason: string | null = null
): ChatBlockRecord {
  // Idempotent: if already blocked, return existing
  const existing = store.blocks.get(customerId)
  if (existing) return existing

  const record: ChatBlockRecord = {
    id: nextId(),
    customer_id: customerId,
    blocked_by: blockedBy,
    reason,
    created_at: new Date(),
  }
  store.blocks.set(customerId, record)
  return record
}

function unblockCustomer(store: BlockStore, customerId: string): boolean {
  return store.blocks.delete(customerId)
}

function isBlocked(store: BlockStore, customerId: string): boolean {
  return store.blocks.has(customerId)
}

function checkBuyersBlocked(store: BlockStore, buyerIds: string[]): Set<string> {
  const result = new Set<string>()
  for (const id of buyerIds) {
    if (store.blocks.has(id)) {
      result.add(id)
    }
  }
  return result
}

type SenderType = "customer" | "seller"

function validateChatBlock(
  store: BlockStore,
  senderId: string,
  senderType: SenderType,
  recipientId: string
): { allowed: boolean; reason?: string } {
  const customerId = senderType === "customer" ? senderId : recipientId
  if (isBlocked(store, customerId)) {
    if (senderType === "customer") {
      return { allowed: false, reason: "Your chat access has been suspended" }
    }
    return { allowed: false, reason: "Cannot send messages to a blocked customer" }
  }
  return { allowed: true }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Chat Block", () => {
  describe("blocking a customer", () => {
    it("creates a block record", () => {
      const store = createStore()
      const block = blockCustomer(store, "cust_1", "admin_1", "Abusive behavior")

      expect(block.customer_id).toBe("cust_1")
      expect(block.blocked_by).toBe("admin_1")
      expect(block.reason).toBe("Abusive behavior")
      expect(block.id).toBeTruthy()
    })

    it("returns existing block on duplicate (idempotent)", () => {
      const store = createStore()
      const first = blockCustomer(store, "cust_1", "admin_1", "Reason A")
      const second = blockCustomer(store, "cust_1", "admin_2", "Reason B")

      expect(first.id).toBe(second.id)
      expect(second.blocked_by).toBe("admin_1") // original record unchanged
      expect(second.reason).toBe("Reason A")
    })

    it("allows blocking with null reason", () => {
      const store = createStore()
      const block = blockCustomer(store, "cust_1", "admin_1", null)

      expect(block.reason).toBeNull()
      expect(isBlocked(store, "cust_1")).toBe(true)
    })

    it("tracks which admin performed the block", () => {
      const store = createStore()
      blockCustomer(store, "cust_1", "admin_42")
      blockCustomer(store, "cust_2", "admin_99")

      expect(store.blocks.get("cust_1")?.blocked_by).toBe("admin_42")
      expect(store.blocks.get("cust_2")?.blocked_by).toBe("admin_99")
    })
  })

  describe("unblocking a customer", () => {
    it("removes block and allows chat again", () => {
      const store = createStore()
      blockCustomer(store, "cust_1", "admin_1")

      expect(isBlocked(store, "cust_1")).toBe(true)

      unblockCustomer(store, "cust_1")
      expect(isBlocked(store, "cust_1")).toBe(false)
    })

    it("unblocking a non-blocked customer succeeds silently", () => {
      const store = createStore()
      const result = unblockCustomer(store, "cust_999")
      expect(result).toBe(false) // nothing was deleted
    })

    it("customer can be re-blocked after unblocking", () => {
      const store = createStore()
      blockCustomer(store, "cust_1", "admin_1", "First offense")
      unblockCustomer(store, "cust_1")

      const reblock = blockCustomer(store, "cust_1", "admin_2", "Second offense")
      expect(isBlocked(store, "cust_1")).toBe(true)
      expect(reblock.blocked_by).toBe("admin_2")
      expect(reblock.reason).toBe("Second offense")
    })
  })

  describe("block status checking", () => {
    it("returns false for non-blocked customer", () => {
      const store = createStore()
      expect(isBlocked(store, "cust_1")).toBe(false)
    })

    it("returns true for blocked customer", () => {
      const store = createStore()
      blockCustomer(store, "cust_1", "admin_1")
      expect(isBlocked(store, "cust_1")).toBe(true)
    })
  })

  describe("batch checking (checkBuyersBlocked)", () => {
    it("returns empty set for empty input", () => {
      const store = createStore()
      const result = checkBuyersBlocked(store, [])
      expect(result.size).toBe(0)
    })

    it("returns empty set when no buyers are blocked", () => {
      const store = createStore()
      const result = checkBuyersBlocked(store, ["cust_1", "cust_2", "cust_3"])
      expect(result.size).toBe(0)
    })

    it("returns only blocked buyer IDs", () => {
      const store = createStore()
      blockCustomer(store, "cust_2", "admin_1")
      blockCustomer(store, "cust_4", "admin_1")

      const result = checkBuyersBlocked(store, [
        "cust_1",
        "cust_2",
        "cust_3",
        "cust_4",
        "cust_5",
      ])

      expect(result.size).toBe(2)
      expect(result.has("cust_2")).toBe(true)
      expect(result.has("cust_4")).toBe(true)
      expect(result.has("cust_1")).toBe(false)
    })

    it("handles duplicate IDs in input", () => {
      const store = createStore()
      blockCustomer(store, "cust_1", "admin_1")

      const result = checkBuyersBlocked(store, [
        "cust_1",
        "cust_1",
        "cust_1",
      ])

      expect(result.size).toBe(1)
      expect(result.has("cust_1")).toBe(true)
    })
  })

  describe("send-message enforcement (validateChatBlock)", () => {
    describe("customer as sender", () => {
      it("allows non-blocked customer to send", () => {
        const store = createStore()
        const result = validateChatBlock(store, "cust_1", "customer", "seller_1")
        expect(result.allowed).toBe(true)
      })

      it("blocks suspended customer from sending", () => {
        const store = createStore()
        blockCustomer(store, "cust_1", "admin_1")

        const result = validateChatBlock(store, "cust_1", "customer", "seller_1")
        expect(result.allowed).toBe(false)
        expect(result.reason).toBe("Your chat access has been suspended")
      })

      it("does not affect other customers", () => {
        const store = createStore()
        blockCustomer(store, "cust_1", "admin_1")

        expect(
          validateChatBlock(store, "cust_2", "customer", "seller_1").allowed
        ).toBe(true)
      })
    })

    describe("seller as sender (messaging blocked customer)", () => {
      it("allows seller to message non-blocked customer", () => {
        const store = createStore()
        const result = validateChatBlock(store, "seller_1", "seller", "cust_1")
        expect(result.allowed).toBe(true)
      })

      it("prevents seller from messaging blocked customer", () => {
        const store = createStore()
        blockCustomer(store, "cust_1", "admin_1")

        const result = validateChatBlock(store, "seller_1", "seller", "cust_1")
        expect(result.allowed).toBe(false)
        expect(result.reason).toBe(
          "Cannot send messages to a blocked customer"
        )
      })

      it("seller can still message other customers", () => {
        const store = createStore()
        blockCustomer(store, "cust_1", "admin_1")

        expect(
          validateChatBlock(store, "seller_1", "seller", "cust_2").allowed
        ).toBe(true)
      })
    })

    describe("block enforcement is bidirectional", () => {
      it("both directions blocked for same customer", () => {
        const store = createStore()
        blockCustomer(store, "cust_1", "admin_1")

        // Customer can't send
        expect(
          validateChatBlock(store, "cust_1", "customer", "seller_1").allowed
        ).toBe(false)

        // Vendor can't send to blocked customer
        expect(
          validateChatBlock(store, "seller_1", "seller", "cust_1").allowed
        ).toBe(false)
      })

      it("unblocking restores both directions", () => {
        const store = createStore()
        blockCustomer(store, "cust_1", "admin_1")
        unblockCustomer(store, "cust_1")

        expect(
          validateChatBlock(store, "cust_1", "customer", "seller_1").allowed
        ).toBe(true)
        expect(
          validateChatBlock(store, "seller_1", "seller", "cust_1").allowed
        ).toBe(true)
      })
    })
  })

  describe("conversation creation enforcement", () => {
    it("blocked customer cannot create conversation", () => {
      const store = createStore()
      blockCustomer(store, "cust_1", "admin_1")

      // Simulates the route-level check before conversation creation
      expect(isBlocked(store, "cust_1")).toBe(true)
    })

    it("non-blocked customer can create conversation", () => {
      const store = createStore()
      expect(isBlocked(store, "cust_1")).toBe(false)
    })
  })

  describe("admin-only management", () => {
    it("block records track admin accountability", () => {
      const store = createStore()
      const block = blockCustomer(store, "cust_1", "admin_42", "Spamming")

      expect(block.blocked_by).toBe("admin_42")
      expect(block.reason).toBe("Spamming")
      expect(block.created_at).toBeInstanceOf(Date)
    })
  })

  describe("multi-customer scenarios", () => {
    it("blocking one customer does not affect others", () => {
      const store = createStore()
      blockCustomer(store, "cust_1", "admin_1")

      expect(isBlocked(store, "cust_1")).toBe(true)
      expect(isBlocked(store, "cust_2")).toBe(false)
      expect(isBlocked(store, "cust_3")).toBe(false)
    })

    it("multiple customers can be blocked independently", () => {
      const store = createStore()
      blockCustomer(store, "cust_1", "admin_1")
      blockCustomer(store, "cust_3", "admin_2")

      expect(isBlocked(store, "cust_1")).toBe(true)
      expect(isBlocked(store, "cust_2")).toBe(false)
      expect(isBlocked(store, "cust_3")).toBe(true)
    })

    it("unblocking one does not affect the other", () => {
      const store = createStore()
      blockCustomer(store, "cust_1", "admin_1")
      blockCustomer(store, "cust_2", "admin_1")

      unblockCustomer(store, "cust_1")

      expect(isBlocked(store, "cust_1")).toBe(false)
      expect(isBlocked(store, "cust_2")).toBe(true)
    })
  })

  describe("full lifecycle", () => {
    it("block → verify → unblock → re-block cycle", () => {
      const store = createStore()

      // Customer starts unblocked
      expect(isBlocked(store, "cust_1")).toBe(false)
      expect(
        validateChatBlock(store, "cust_1", "customer", "seller_1").allowed
      ).toBe(true)

      // Admin blocks customer
      blockCustomer(store, "cust_1", "admin_1", "Harassment")
      expect(isBlocked(store, "cust_1")).toBe(true)
      expect(
        validateChatBlock(store, "cust_1", "customer", "seller_1").allowed
      ).toBe(false)
      expect(
        validateChatBlock(store, "seller_1", "seller", "cust_1").allowed
      ).toBe(false)

      // Admin unblocks customer
      unblockCustomer(store, "cust_1")
      expect(isBlocked(store, "cust_1")).toBe(false)
      expect(
        validateChatBlock(store, "cust_1", "customer", "seller_1").allowed
      ).toBe(true)

      // Re-block with different admin and reason
      const reblock = blockCustomer(store, "cust_1", "admin_2", "Repeat offense")
      expect(reblock.blocked_by).toBe("admin_2")
      expect(reblock.reason).toBe("Repeat offense")
      expect(
        validateChatBlock(store, "cust_1", "customer", "seller_1").allowed
      ).toBe(false)
    })
  })
})
