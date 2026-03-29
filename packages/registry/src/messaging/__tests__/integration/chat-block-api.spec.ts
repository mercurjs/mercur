import { describe, it, expect } from "vitest"

/**
 * Integration tests for the chat-block API routes.
 *
 * These tests verify the full request/response contract of admin block
 * management endpoints and the block-enforcement behavior on store and
 * vendor routes.  They do not hit a real database — they simulate the
 * route-level logic and workflow orchestration to validate:
 *
 *   1. Admin can block/unblock customers via the admin API
 *   2. Blocked customers are rejected when creating conversations
 *   3. Blocked customers are rejected when sending messages
 *   4. Vendors cannot send to blocked customers
 *   5. Block status is surfaced in list and detail responses
 *   6. Idempotent block/unblock operations
 */

// ---------------------------------------------------------------------------
// In-memory service simulation
// ---------------------------------------------------------------------------

type ChatBlock = {
  id: string
  customer_id: string
  blocked_by: string
  reason: string | null
  created_at: string
}

type Conversation = {
  id: string
  buyer_id: string
  seller_id: string
}

class MockMessagingService {
  private blocks = new Map<string, ChatBlock>()
  private conversations: Conversation[] = []
  private idCounter = 0

  // -- Block management (simulates MedusaService CRUD) --

  async createChatBlocks(
    data: Array<{ customer_id: string; blocked_by: string; reason: string | null }>
  ): Promise<ChatBlock[]> {
    return data.map((d) => {
      const block: ChatBlock = {
        id: `cblk_${++this.idCounter}`,
        customer_id: d.customer_id,
        blocked_by: d.blocked_by,
        reason: d.reason,
        created_at: new Date().toISOString(),
      }
      this.blocks.set(d.customer_id, block)
      return block
    })
  }

  async listChatBlocks(
    filter: { customer_id?: string },
    _opts?: { take?: number }
  ): Promise<ChatBlock[]> {
    if (filter.customer_id) {
      const block = this.blocks.get(filter.customer_id)
      return block ? [block] : []
    }
    return [...this.blocks.values()]
  }

  async deleteChatBlocks(ids: string[]): Promise<void> {
    for (const [key, block] of this.blocks) {
      if (ids.includes(block.id)) {
        this.blocks.delete(key)
      }
    }
  }

  async checkBuyersBlocked(buyerIds: string[]): Promise<Set<string>> {
    const result = new Set<string>()
    for (const id of buyerIds) {
      if (this.blocks.has(id)) {
        result.add(id)
      }
    }
    return result
  }

  // -- Conversations (minimal simulation) --

  addConversation(conv: Conversation) {
    this.conversations.push(conv)
  }

  async listConversations(
    filter: { id?: string; buyer_id?: string; seller_id?: string },
    _opts?: { take?: number }
  ): Promise<Conversation[]> {
    return this.conversations.filter((c) => {
      if (filter.id && c.id !== filter.id) return false
      if (filter.buyer_id && c.buyer_id !== filter.buyer_id) return false
      if (filter.seller_id && c.seller_id !== filter.seller_id) return false
      return true
    })
  }
}

// ---------------------------------------------------------------------------
// Route handler simulations
// ---------------------------------------------------------------------------

type RouteResult = {
  status: number
  body: any
}

async function adminBlockCustomer(
  service: MockMessagingService,
  adminUserId: string,
  customerId: string,
  reason?: string
): Promise<RouteResult> {
  // Simulate POST /admin/messages/chat-blocks
  const existing = await service.listChatBlocks({ customer_id: customerId }, { take: 1 })
  if (existing.length > 0) {
    return { status: 201, body: { block: existing[0] } }
  }

  const [block] = await service.createChatBlocks([{
    customer_id: customerId,
    blocked_by: adminUserId,
    reason: reason ?? null,
  }])

  return { status: 201, body: { block } }
}

async function adminUnblockCustomer(
  service: MockMessagingService,
  customerId: string
): Promise<RouteResult> {
  // Simulate DELETE /admin/messages/chat-blocks/:customer_id
  const existing = await service.listChatBlocks({ customer_id: customerId }, { take: 1 })
  if (existing.length === 0) {
    return { status: 200, body: { success: true } }
  }
  await service.deleteChatBlocks([existing[0].id])
  return { status: 200, body: { success: true } }
}

async function adminCheckBlockStatus(
  service: MockMessagingService,
  customerId: string
): Promise<RouteResult> {
  // Simulate GET /admin/messages/chat-blocks/:customer_id
  const blocked = await service.checkBuyersBlocked([customerId])
  return { status: 200, body: { is_blocked: blocked.has(customerId) } }
}

async function storeCreateConversation(
  service: MockMessagingService,
  buyerId: string,
  sellerId: string
): Promise<RouteResult> {
  // Simulate POST /store/messages (block check before conversation creation)
  const blocked = await service.checkBuyersBlocked([buyerId])
  if (blocked.has(buyerId)) {
    return {
      status: 403,
      body: { type: "not_allowed", message: "Your chat access has been suspended" },
    }
  }

  // Find or create conversation
  const existing = await service.listConversations({ buyer_id: buyerId, seller_id: sellerId })
  if (existing.length > 0) {
    return { status: 200, body: { conversation: existing[0] } }
  }

  const conv: Conversation = { id: `conv_${Date.now()}`, buyer_id: buyerId, seller_id: sellerId }
  service.addConversation(conv)
  return { status: 200, body: { conversation: conv } }
}

async function storeSendMessage(
  service: MockMessagingService,
  buyerId: string,
  conversationId: string
): Promise<RouteResult> {
  // Simulate POST /store/messages/:id (block check before reply)
  const conversations = await service.listConversations({ id: conversationId, buyer_id: buyerId })
  if (conversations.length === 0) {
    return { status: 404, body: { type: "not_found", message: "Conversation not found" } }
  }

  const blocked = await service.checkBuyersBlocked([buyerId])
  if (blocked.has(buyerId)) {
    return {
      status: 403,
      body: { type: "not_allowed", message: "Your chat access has been suspended" },
    }
  }

  return { status: 200, body: { message: { id: "msg_test", body: "test" } } }
}

async function vendorSendMessage(
  service: MockMessagingService,
  sellerId: string,
  conversationId: string
): Promise<RouteResult> {
  // Simulate POST /vendor/messages/:id (block check before sending)
  const conversations = await service.listConversations({ id: conversationId, seller_id: sellerId })
  if (conversations.length === 0) {
    return { status: 404, body: { type: "not_found", message: "Conversation not found" } }
  }

  const conv = conversations[0]
  const blocked = await service.checkBuyersBlocked([conv.buyer_id])
  if (blocked.has(conv.buyer_id)) {
    return {
      status: 403,
      body: { type: "not_allowed", message: "Cannot send messages to a blocked customer" },
    }
  }

  return { status: 200, body: { message: { id: "msg_test", body: "test" } } }
}

async function vendorGetConversation(
  service: MockMessagingService,
  sellerId: string,
  conversationId: string
): Promise<RouteResult> {
  // Simulate GET /vendor/messages/:id (includes is_buyer_blocked)
  const conversations = await service.listConversations({ id: conversationId, seller_id: sellerId })
  if (conversations.length === 0) {
    return { status: 404, body: { type: "not_found", message: "Conversation not found" } }
  }

  const conv = conversations[0]
  const blockedSet = await service.checkBuyersBlocked([conv.buyer_id])

  return {
    status: 200,
    body: {
      conversation: {
        ...conv,
        is_buyer_blocked: blockedSet.has(conv.buyer_id),
      },
    },
  }
}

async function adminGetConversationList(
  service: MockMessagingService,
  conversations: Conversation[]
): Promise<RouteResult> {
  // Simulate GET /admin/messages (annotate block status)
  const buyerIds = [...new Set(conversations.map((c) => c.buyer_id))]
  const blockedSet = await service.checkBuyersBlocked(buyerIds)

  return {
    status: 200,
    body: {
      conversations: conversations.map((c) => ({
        ...c,
        is_buyer_blocked: blockedSet.has(c.buyer_id),
      })),
    },
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Chat Block API Integration", () => {
  describe("Admin block management", () => {
    it("POST /admin/messages/chat-blocks creates a block", async () => {
      const service = new MockMessagingService()
      const result = await adminBlockCustomer(service, "admin_1", "cust_1", "Spam")

      expect(result.status).toBe(201)
      expect(result.body.block.customer_id).toBe("cust_1")
      expect(result.body.block.blocked_by).toBe("admin_1")
      expect(result.body.block.reason).toBe("Spam")
    })

    it("POST /admin/messages/chat-blocks is idempotent", async () => {
      const service = new MockMessagingService()
      const first = await adminBlockCustomer(service, "admin_1", "cust_1")
      const second = await adminBlockCustomer(service, "admin_2", "cust_1")

      expect(first.body.block.id).toBe(second.body.block.id)
    })

    it("GET /admin/messages/chat-blocks/:id returns block status", async () => {
      const service = new MockMessagingService()

      let status = await adminCheckBlockStatus(service, "cust_1")
      expect(status.body.is_blocked).toBe(false)

      await adminBlockCustomer(service, "admin_1", "cust_1")

      status = await adminCheckBlockStatus(service, "cust_1")
      expect(status.body.is_blocked).toBe(true)
    })

    it("DELETE /admin/messages/chat-blocks/:id removes block", async () => {
      const service = new MockMessagingService()
      await adminBlockCustomer(service, "admin_1", "cust_1")
      await adminUnblockCustomer(service, "cust_1")

      const status = await adminCheckBlockStatus(service, "cust_1")
      expect(status.body.is_blocked).toBe(false)
    })

    it("DELETE for non-blocked customer succeeds silently", async () => {
      const service = new MockMessagingService()
      const result = await adminUnblockCustomer(service, "cust_999")
      expect(result.status).toBe(200)
      expect(result.body.success).toBe(true)
    })
  })

  describe("Store block enforcement", () => {
    it("blocked customer cannot create conversation", async () => {
      const service = new MockMessagingService()
      await adminBlockCustomer(service, "admin_1", "cust_1")

      const result = await storeCreateConversation(service, "cust_1", "seller_1")
      expect(result.status).toBe(403)
      expect(result.body.type).toBe("not_allowed")
      expect(result.body.message).toContain("suspended")
    })

    it("non-blocked customer can create conversation", async () => {
      const service = new MockMessagingService()
      const result = await storeCreateConversation(service, "cust_1", "seller_1")
      expect(result.status).toBe(200)
      expect(result.body.conversation).toBeTruthy()
    })

    it("blocked customer cannot send message", async () => {
      const service = new MockMessagingService()
      service.addConversation({ id: "conv_1", buyer_id: "cust_1", seller_id: "seller_1" })

      await adminBlockCustomer(service, "admin_1", "cust_1")

      const result = await storeSendMessage(service, "cust_1", "conv_1")
      expect(result.status).toBe(403)
      expect(result.body.type).toBe("not_allowed")
    })

    it("non-blocked customer can send message", async () => {
      const service = new MockMessagingService()
      service.addConversation({ id: "conv_1", buyer_id: "cust_1", seller_id: "seller_1" })

      const result = await storeSendMessage(service, "cust_1", "conv_1")
      expect(result.status).toBe(200)
      expect(result.body.message).toBeTruthy()
    })

    it("unblocked customer can send again", async () => {
      const service = new MockMessagingService()
      service.addConversation({ id: "conv_1", buyer_id: "cust_1", seller_id: "seller_1" })

      await adminBlockCustomer(service, "admin_1", "cust_1")
      const blocked = await storeSendMessage(service, "cust_1", "conv_1")
      expect(blocked.status).toBe(403)

      await adminUnblockCustomer(service, "cust_1")
      const unblocked = await storeSendMessage(service, "cust_1", "conv_1")
      expect(unblocked.status).toBe(200)
    })
  })

  describe("Vendor block enforcement", () => {
    it("vendor cannot send to blocked customer", async () => {
      const service = new MockMessagingService()
      service.addConversation({ id: "conv_1", buyer_id: "cust_1", seller_id: "seller_1" })

      await adminBlockCustomer(service, "admin_1", "cust_1")

      const result = await vendorSendMessage(service, "seller_1", "conv_1")
      expect(result.status).toBe(403)
      expect(result.body.message).toContain("blocked customer")
    })

    it("vendor can send to non-blocked customer", async () => {
      const service = new MockMessagingService()
      service.addConversation({ id: "conv_1", buyer_id: "cust_1", seller_id: "seller_1" })

      const result = await vendorSendMessage(service, "seller_1", "conv_1")
      expect(result.status).toBe(200)
    })

    it("vendor can still view conversation of blocked customer", async () => {
      const service = new MockMessagingService()
      service.addConversation({ id: "conv_1", buyer_id: "cust_1", seller_id: "seller_1" })

      await adminBlockCustomer(service, "admin_1", "cust_1")

      const result = await vendorGetConversation(service, "seller_1", "conv_1")
      expect(result.status).toBe(200)
      expect(result.body.conversation.is_buyer_blocked).toBe(true)
    })
  })

  describe("Block status in responses", () => {
    it("vendor GET /messages/:id includes is_buyer_blocked", async () => {
      const service = new MockMessagingService()
      service.addConversation({ id: "conv_1", buyer_id: "cust_1", seller_id: "seller_1" })

      // Not blocked
      let result = await vendorGetConversation(service, "seller_1", "conv_1")
      expect(result.body.conversation.is_buyer_blocked).toBe(false)

      // Blocked
      await adminBlockCustomer(service, "admin_1", "cust_1")
      result = await vendorGetConversation(service, "seller_1", "conv_1")
      expect(result.body.conversation.is_buyer_blocked).toBe(true)
    })

    it("admin GET /messages annotates block status per conversation", async () => {
      const service = new MockMessagingService()
      const convs: Conversation[] = [
        { id: "conv_1", buyer_id: "cust_1", seller_id: "seller_1" },
        { id: "conv_2", buyer_id: "cust_2", seller_id: "seller_1" },
        { id: "conv_3", buyer_id: "cust_3", seller_id: "seller_2" },
      ]

      await adminBlockCustomer(service, "admin_1", "cust_2")

      const result = await adminGetConversationList(service, convs)
      expect(result.status).toBe(200)

      const list = result.body.conversations
      expect(list[0].is_buyer_blocked).toBe(false) // cust_1
      expect(list[1].is_buyer_blocked).toBe(true)  // cust_2
      expect(list[2].is_buyer_blocked).toBe(false) // cust_3
    })

    it("batch check handles same buyer in multiple conversations", async () => {
      const service = new MockMessagingService()
      const convs: Conversation[] = [
        { id: "conv_1", buyer_id: "cust_1", seller_id: "seller_1" },
        { id: "conv_2", buyer_id: "cust_1", seller_id: "seller_2" },
      ]

      await adminBlockCustomer(service, "admin_1", "cust_1")

      const result = await adminGetConversationList(service, convs)
      expect(result.body.conversations[0].is_buyer_blocked).toBe(true)
      expect(result.body.conversations[1].is_buyer_blocked).toBe(true)
    })
  })

  describe("Cross-feature interaction", () => {
    it("blocking does not affect other customers' conversations", async () => {
      const service = new MockMessagingService()
      service.addConversation({ id: "conv_1", buyer_id: "cust_1", seller_id: "seller_1" })
      service.addConversation({ id: "conv_2", buyer_id: "cust_2", seller_id: "seller_1" })

      await adminBlockCustomer(service, "admin_1", "cust_1")

      // cust_2 can still create and send
      const createResult = await storeCreateConversation(service, "cust_2", "seller_2")
      expect(createResult.status).toBe(200)

      const sendResult = await storeSendMessage(service, "cust_2", "conv_2")
      expect(sendResult.status).toBe(200)
    })

    it("full lifecycle: block, verify enforcement, unblock, verify restored", async () => {
      const service = new MockMessagingService()
      service.addConversation({ id: "conv_1", buyer_id: "cust_1", seller_id: "seller_1" })

      // 1. Customer can chat
      expect((await storeSendMessage(service, "cust_1", "conv_1")).status).toBe(200)
      expect((await vendorSendMessage(service, "seller_1", "conv_1")).status).toBe(200)

      // 2. Admin blocks
      await adminBlockCustomer(service, "admin_1", "cust_1", "Harassment")

      // 3. Both sides blocked
      expect((await storeSendMessage(service, "cust_1", "conv_1")).status).toBe(403)
      expect((await vendorSendMessage(service, "seller_1", "conv_1")).status).toBe(403)

      // 4. Vendor can still view
      const view = await vendorGetConversation(service, "seller_1", "conv_1")
      expect(view.status).toBe(200)
      expect(view.body.conversation.is_buyer_blocked).toBe(true)

      // 5. Admin unblocks
      await adminUnblockCustomer(service, "cust_1")

      // 6. Both sides restored
      expect((await storeSendMessage(service, "cust_1", "conv_1")).status).toBe(200)
      expect((await vendorSendMessage(service, "seller_1", "conv_1")).status).toBe(200)

      // 7. Badge cleared
      const viewAfter = await vendorGetConversation(service, "seller_1", "conv_1")
      expect(viewAfter.body.conversation.is_buyer_blocked).toBe(false)
    })
  })
})
