# Messaging Plugin — Storefront Implementation Guide

This guide covers how to integrate the buyer-vendor messaging plugin into a storefront application. It documents every Store API endpoint, the SSE real-time event system, cursor-based pagination, context linking, error handling, and rate limiting behavior.

The guide is framework-agnostic. Adapt the patterns to your stack (Next.js, Remix, plain JS, React Native, etc.).

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Authentication](#authentication)
3. [API Overview](#api-overview)
4. [Creating a Conversation](#creating-a-conversation)
5. [Listing Conversations](#listing-conversations)
6. [Fetching Messages (Cursor Pagination)](#fetching-messages-cursor-pagination)
7. [Sending a Message](#sending-a-message)
8. [Marking Messages as Read](#marking-messages-as-read)
9. [Unread Count](#unread-count)
10. [Real-Time Updates (SSE)](#real-time-updates-sse)
11. [Context Linking (Product / Order)](#context-linking-product--order)
12. [Rate Limiting](#rate-limiting)
13. [Content Filtering](#content-filtering)
14. [Chat Blocking](#chat-blocking)
15. [Error Reference](#error-reference)
16. [Full Integration Example](#full-integration-example)

---

## Prerequisites

The messaging block must be installed and configured in your Medusa backend:

```bash
mercurjs add messaging
```

Required backend environment variable:

```
REDIS_URL=redis://localhost:6379
```

The storefront must authenticate customers via Medusa's standard session or bearer token auth. All Store messaging endpoints require an authenticated customer.

---

## Authentication

All `/store/messages/*` endpoints (except the SSE stream) require a standard Medusa customer session. If you are using the Medusa JS SDK:

```ts
import Medusa from "@medusajs/js-sdk"

const sdk = new Medusa({
  baseUrl: "http://localhost:9000",
  auth: { type: "session" },
})

// Customer must be logged in before calling messaging endpoints
await sdk.auth.login("customer", "emailpass", {
  email: "buyer@example.com",
  password: "password",
})
```

If using raw `fetch`, include credentials:

```ts
fetch("http://localhost:9000/store/messages", {
  credentials: "include", // sends session cookie
})
```

The SSE endpoint uses a separate token-based auth flow — see [Real-Time Updates (SSE)](#real-time-updates-sse).

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/store/messages` | List customer's conversations |
| `POST` | `/store/messages` | Create conversation (+ optional first message) |
| `GET` | `/store/messages/:id` | Get messages in a conversation |
| `POST` | `/store/messages/:id` | Send a message |
| `POST` | `/store/messages/:id/read` | Mark messages as read |
| `GET` | `/store/messages/unread` | Get total unread count |
| `POST` | `/store/messages/sse-token` | Obtain one-time SSE auth token |
| `GET` | `/store/messages/events?token=` | SSE stream (token-based auth) |

---

## Creating a Conversation

Start a new conversation with a seller. If a conversation already exists between the customer and seller, the existing one is returned.

```
POST /store/messages
```

### Request Body

```ts
{
  seller_id: string          // Required — the seller to message
  body?: string              // Optional — first message (1-2000 chars)
  context_type?: "product" | "order"  // Optional — link to a product or order
  context_id?: string        // Required if context_type is set
}
```

`context_type` and `context_id` must both be provided or both omitted. When provided, the backend resolves a human-readable label automatically (product title or "Order #display_id").

### Response

```ts
{
  conversation: {
    id: string               // e.g. "conv_01ABC..."
    seller_id: string
    last_message_preview: string | null
    last_message_sender_type: "customer" | "seller" | null
    last_message_at: string | null
    unread_count_customer: number
    created_at: string
  }
  message?: {                // Only present if body was provided
    id: string
    sender_type: "customer"
    body: string
    context_type: "product" | "order" | null
    context_id: string | null
    context_label: string | null
    read_at: null
    created_at: string
  }
}
```

### Example

```ts
// Create conversation with first message about a product
const res = await sdk.client.fetch("/store/messages", {
  method: "POST",
  body: {
    seller_id: "sel_01XYZ",
    body: "Hi, is this item available in blue?",
    context_type: "product",
    context_id: "prod_01ABC",
  },
})

const { conversation, message } = res
// conversation.id → use for subsequent messages
```

### Idempotency

If a conversation already exists between the customer and seller, it is returned (not duplicated). The unique constraint is on `(buyer_id, seller_id)`. A new message is still created if `body` is provided.

---

## Listing Conversations

Retrieve the customer's conversations, ordered by most recent activity.

```
GET /store/messages
```

### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `cursor` | string | — | Pagination cursor from previous response |
| `limit` | number | 20 | Items per page (1-50) |

### Response

```ts
{
  conversations: Array<{
    id: string
    seller_id: string
    last_message_preview: string | null
    last_message_sender_type: "customer" | "seller" | null
    last_message_at: string | null
    unread_count_customer: number
    created_at: string
  }>
  next_cursor: string | null  // null when no more pages
}
```

### Pagination

```ts
// First page
const page1 = await sdk.client.fetch("/store/messages?limit=20")

// Next page (if available)
if (page1.next_cursor) {
  const page2 = await sdk.client.fetch(
    `/store/messages?limit=20&cursor=${page1.next_cursor}`
  )
}
```

Cursors are opaque base64 strings. Do not parse or construct them — always use the `next_cursor` value from the previous response.

---

## Fetching Messages (Cursor Pagination)

Retrieve messages in a conversation. Messages are returned in **descending order** (newest first). Use cursor pagination to load older messages.

```
GET /store/messages/:id
```

### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `cursor` | string | — | Pagination cursor for older messages |
| `limit` | number | 20 | Messages per page (1-100) |

### Response

```ts
{
  conversation: {
    id: string
    seller_id: string
    last_message_preview: string | null
    last_message_sender_type: "customer" | "seller" | null
    last_message_at: string | null
    unread_count_customer: number
    created_at: string
  }
  messages: Array<{
    id: string
    sender_type: "customer" | "seller"
    body: string
    context_type: "product" | "order" | null
    context_id: string | null
    context_label: string | null   // e.g. "Blue Widget" or "Order #1042"
    read_at: string | null
    created_at: string
  }>
  next_cursor: string | null
}
```

### Loading Older Messages

Since messages arrive newest-first, "load more" means fetching the next cursor page:

```ts
// Initial load — most recent 20 messages
const page1 = await sdk.client.fetch(`/store/messages/${conversationId}?limit=20`)

// User clicks "Load older messages"
if (page1.next_cursor) {
  const page2 = await sdk.client.fetch(
    `/store/messages/${conversationId}?limit=20&cursor=${page1.next_cursor}`
  )
  // Prepend page2.messages before page1.messages for chronological display
}
```

### Display Order

The API returns messages in descending order. Reverse them for chronological display:

```ts
const allMessages = [...olderPages, ...newerPages].flat()
const chronological = allMessages.reverse()
```

Or accumulate pages and reverse the full set:

```ts
// pages = [page1.messages, page2.messages, ...]
// Each page is desc; later pages are older
const messages = pages.flatMap((p) => p.messages)
const display = [...messages].reverse()
```

---

## Sending a Message

Send a reply in an existing conversation.

```
POST /store/messages/:id
```

### Request Body

```ts
{
  body: string                       // Required (1-2000 chars)
  context_type?: "product" | "order" // Optional context link
  context_id?: string                // Required if context_type is set
}
```

### Response

```ts
{
  message: {
    id: string
    sender_type: "customer"
    body: string
    context_type: "product" | "order" | null
    context_id: string | null
    context_label: string | null
    read_at: null
    created_at: string
  }
}
```

### Example

```ts
const res = await sdk.client.fetch(`/store/messages/${conversationId}`, {
  method: "POST",
  body: {
    body: "Thanks, I'll take it!",
    context_type: "order",
    context_id: "order_01XYZ",
  },
})
```

### What happens server-side

1. Ownership verified (customer must own the conversation)
2. Rate limit checked (20 messages per 60 seconds)
3. Content filter evaluated (blocks emails, phone numbers, URLs, and custom rules)
4. Message created atomically (updates conversation preview, increments seller's unread count)
5. SSE event published to the seller in real-time
6. Medusa event `messaging.message.created` emitted

---

## Marking Messages as Read

Mark all unread messages from the seller as read and reset the customer's unread counter.

```
POST /store/messages/:id/read
```

### Request Body

Empty object `{}`.

### Response

```ts
{
  success: true,
  unread_count_customer: 0
}
```

### When to call

Call this when the customer opens a conversation or scrolls to unread messages. The backend:

1. Sets `read_at` on all unread seller messages in this conversation
2. Resets `unread_count_customer` to 0
3. Publishes a `messages_read` SSE event to the seller (so they see "Read" receipts)
4. Publishes an `unread_count` SSE event to the customer (confirms count reset)

---

## Unread Count

Get the total unread message count across all conversations.

```
GET /store/messages/unread
```

### Response

```ts
{
  unread_count: number
}
```

Use this for badge counts in navigation (e.g. "Messages (3)"). Poll this periodically as a fallback if SSE is not connected, or rely on `unread_count` SSE events for real-time updates.

---

## Real-Time Updates (SSE)

The plugin uses Server-Sent Events for real-time message delivery. The store SSE uses a **token-based authentication** flow because `EventSource` does not support custom headers.

### Connection Flow

#### Step 1: Obtain a one-time token

```
POST /store/messages/sse-token
```

This requires a standard authenticated session. Response:

```ts
{
  token: string,     // UUID, one-time use
  expires_in: 30     // seconds
}
```

The token is stored in Redis with a 30-second TTL. It is consumed (deleted) on the first SSE connection attempt.

#### Step 2: Open the SSE stream

```
GET /store/messages/events?token={token}
```

This endpoint does **not** require session auth — the token authenticates the request.

```ts
// Full connection flow
async function connectSSE() {
  // Step 1: Get token (authenticated request)
  const { token } = await sdk.client.fetch("/store/messages/sse-token", {
    method: "POST",
  })

  // Step 2: Open SSE stream (token-based, no session needed)
  const eventSource = new EventSource(
    `${backendUrl}/store/messages/events?token=${token}`
  )

  return eventSource
}
```

### Event Types

The SSE stream emits these named events:

#### `connected`

Sent immediately on successful connection.

```ts
eventSource.addEventListener("connected", (e) => {
  const data = JSON.parse(e.data)
  // { status: "connected" }
})
```

#### `reconnected`

Sent when reconnecting with a `Last-Event-ID`.

```ts
eventSource.addEventListener("reconnected", (e) => {
  const data = JSON.parse(e.data)
  // { status: "reconnected", last_event_id: "..." }
})
```

#### `new_message`

A new message was sent in one of the customer's conversations (either by the customer themselves or by the seller).

```ts
eventSource.addEventListener("new_message", (e) => {
  const data = JSON.parse(e.data)
  // {
  //   conversation_id: "conv_01ABC",
  //   recipient_id: "cus_01XYZ",
  //   sender_type: "customer" | "seller",
  //   event_type: "new_message",
  //   message_id: "msg_01DEF",
  //   context_type?: "product" | "order",
  //   context_label?: "Blue Widget"
  // }

  // Refetch the conversation or append the message
})
```

#### `messages_read`

The seller read messages in a conversation. Use this to show "Read" receipts.

```ts
eventSource.addEventListener("messages_read", (e) => {
  const data = JSON.parse(e.data)
  // {
  //   conversation_id: "conv_01ABC",
  //   event_type: "messages_read"
  // }

  // Update read status on displayed messages
})
```

#### `unread_count`

The customer's total unread count changed (e.g. after marking messages as read, or a new message arrived).

```ts
eventSource.addEventListener("unread_count", (e) => {
  const data = JSON.parse(e.data)
  // {
  //   conversation_id: "conv_01ABC",
  //   event_type: "unread_count",
  //   unread_count: 5
  // }

  // Update badge count
})
```

#### Heartbeat

A comment-only heartbeat (`:heartbeat`) is sent every 30 seconds to keep the connection alive. The browser's `EventSource` handles this automatically — no action needed.

### Reconnection

`EventSource` automatically reconnects on network failure. The browser sends the `Last-Event-ID` header, and the server responds with a `reconnected` event. No messages are replayed — **refetch conversations/messages after reconnection** to catch up.

```ts
eventSource.addEventListener("reconnected", () => {
  // Refetch current conversation and unread count
  refetchConversation()
  refetchUnreadCount()
})

eventSource.addEventListener("error", () => {
  // EventSource auto-reconnects, but the token may have expired.
  // If the connection fails permanently, obtain a new token and reconnect.
  // Use exponential backoff (1s, 2s, 4s, ... max 30s) to avoid overwhelming
  // the server during outages. Reset the delay on successful reconnection.
})
```

### Token Expiry and Reconnection Strategy

The SSE token expires after 30 seconds and is consumed on first use. If the SSE connection drops and the browser's automatic reconnect fails (token already consumed), you must obtain a new token:

```ts
function createSSEConnection(backendUrl, sdk, handlers) {
  let eventSource = null
  let reconnectDelay = 1000

  async function connect() {
    // Always get a fresh token
    const { token } = await sdk.client.fetch("/store/messages/sse-token", {
      method: "POST",
    })

    eventSource = new EventSource(
      `${backendUrl}/store/messages/events?token=${token}`
    )

    eventSource.addEventListener("connected", () => {
      reconnectDelay = 1000 // Reset backoff on success
      handlers.onConnected?.()
    })
    eventSource.addEventListener("new_message", handlers.onNewMessage)
    eventSource.addEventListener("messages_read", handlers.onMessagesRead)
    eventSource.addEventListener("unread_count", handlers.onUnreadCount)

    eventSource.addEventListener("error", () => {
      // Close the dead connection and retry with a new token
      eventSource.close()
      // Exponential backoff: 1s, 2s, 4s, 8s, ..., max 30s
      setTimeout(connect, reconnectDelay)
      reconnectDelay = Math.min(reconnectDelay * 2, 30000)
    })
  }

  function disconnect() {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
  }

  return { connect, disconnect }
}
```

### Non-Browser Clients (React Native, Node.js)

For environments where `EventSource` is not available or does not support query parameters, use any SSE client library. The flow is the same:

1. `POST /store/messages/sse-token` with auth headers
2. Connect to `/store/messages/events?token={token}` as a standard SSE stream
3. Parse `event:` and `data:` fields per the SSE spec

---

## Context Linking (Product / Order)

Messages can be linked to a product or order for contextual conversations (e.g. "Question about this product" or "Issue with order #1042").

### How it works

When sending a message with `context_type` and `context_id`, the backend:

1. **Product context** (`context_type: "product"`): Fetches the product and stores its title as `context_label`
2. **Order context** (`context_type: "order"`): Fetches the order and stores `"Order #<display_id>"` as `context_label`

The resolved `context_label` is returned on every message and persisted — it remains stable even if the product title changes later.

### Validation rules

- `context_type` and `context_id` must both be provided or both omitted
- `context_type` must be `"product"` or `"order"`
- The referenced product or order must exist
- Context is optional on all messages, not just the first one — different messages in a conversation can reference different products/orders

### Example: Asking about a product

```ts
await sdk.client.fetch("/store/messages", {
  method: "POST",
  body: {
    seller_id: "sel_01ABC",
    body: "Is this available in size L?",
    context_type: "product",
    context_id: "prod_01XYZ",
  },
})
// Response message will include:
// context_label: "Blue Cotton T-Shirt" (resolved from product title)
```

### Example: Issue with an order

```ts
await sdk.client.fetch(`/store/messages/${conversationId}`, {
  method: "POST",
  body: {
    body: "I received the wrong item in this order",
    context_type: "order",
    context_id: "order_01ABC",
  },
})
// Response message will include:
// context_label: "Order #1042" (resolved from order display_id)
```

---

## Rate Limiting

The backend enforces per-sender rate limits via Redis sliding windows.

| Limit | Window | Scope |
|-------|--------|-------|
| 20 messages | 60 seconds | Per sender (customer) |
| 5 new conversations | 3600 seconds (1 hour) | Per sender (customer) |

### Behavior

- When exceeded, the API returns HTTP 400 with error type `not_allowed`
- If Redis is unavailable, rate limiting is **skipped** (graceful degradation)
- The window is sliding — it resets based on the oldest message in the window, not on a fixed clock

### Handling rate limit errors

```ts
try {
  await sdk.client.fetch(`/store/messages/${id}`, {
    method: "POST",
    body: { body: "..." },
  })
} catch (error) {
  if (error.type === "not_allowed") {
    // Show "You're sending messages too quickly. Please wait a moment."
  }
}
```

---

## Content Filtering

The backend evaluates every message against a content filter ruleset before accepting it.

### Built-in rules (always active)

1. **Email addresses** — blocks messages containing email patterns
2. **Phone numbers** — blocks messages containing phone number patterns
3. **URLs** — blocks messages containing `http://`, `https://`, or `www.` links

### Admin-configured rules

Store admins can add custom filter rules (exact word match or substring match) via the admin panel. These take effect immediately.

### Behavior

- If a message matches any enabled filter rule, it is **rejected**
- The API returns HTTP 400 with error type `invalid_data`
- The blocked message is logged server-side for admin review
- The original message body is never stored as a message — it only appears in the blocked message log

### Handling filter errors

```ts
try {
  await sdk.client.fetch(`/store/messages/${id}`, {
    method: "POST",
    body: { body: userInput },
  })
} catch (error) {
  if (error.type === "invalid_data") {
    // Show "Your message could not be sent. Please remove any contact
    // information (email, phone, URLs) and try again."
  }
}
```

> **Note**: Do not expose the specific filter rule that matched — the error response does not include it. Show a generic message about content policy.

---

## Chat Blocking

An admin can block a customer from using chat. When a customer is blocked:

- **Creating conversations** (`POST /store/messages`) returns `not_allowed` error
- **Sending messages** (`POST /store/messages/:id`) returns `not_allowed` error
- The customer's storefront account is **not affected** — they can still browse, add to cart, and checkout

### Error messages

| Action | Error message |
|--------|--------------|
| Blocked customer creates conversation | "Your chat access has been suspended" |
| Blocked customer sends message | "Your chat access has been suspended" |

### Handling block errors

```ts
try {
  await sdk.client.fetch(`/store/messages/${id}`, {
    method: "POST",
    body: { body: userInput },
  })
} catch (error) {
  if (error.type === "not_allowed" && error.message.includes("suspended")) {
    // Customer is chat-blocked.
    // Show: "Your chat access has been suspended. Please contact support."
    // Disable the message compose UI to prevent further attempts.
  }
}
```

### UI recommendations

- When a `not_allowed` error with "suspended" message is received, disable the message input and show a notice
- Consider checking block status on the conversation detail page load — if the first `POST` fails with this error, the customer is blocked
- There is no store API to check block status directly — the error on send is the signal

---

## Error Reference

| HTTP Status | Error Type | Cause | Resolution |
|-------------|-----------|-------|------------|
| 401 | `unauthorized` | Missing or invalid session/token | Re-authenticate the customer |
| 400 | `invalid_data` | Validation failed (body too long, missing fields, content filtered) | Fix request body; check content filter rules |
| 400 | `not_allowed` | Rate limit exceeded | Wait and retry after a delay |
| 400 | `not_allowed` | Chat access suspended | Customer has been blocked from chat by an admin. Display the error message to the user. There is no self-service unblock — customer must contact support |
| 404 | `not_found` | Conversation not found or not owned by customer | Verify conversation ID and ownership |
| 404 | `not_found` | Referenced product/order does not exist | Verify context_id |
| 401 | `unauthorized` | SSE token invalid, expired, or already consumed | Obtain a new token via `POST /sse-token` |

All errors follow Medusa's standard error format:

```ts
{
  type: string,      // e.g. "not_allowed", "invalid_data"
  message: string    // Human-readable error description
}
```

---

## Full Integration Example

A complete storefront integration covering all features:

```ts
// messaging-client.ts
// Framework-agnostic messaging integration

// ─── Configuration ───────────────────────────────────────────────

const BACKEND_URL = "http://localhost:9000"
const MESSAGES_PER_PAGE = 20

// Assumes `sdk` is your configured Medusa JS SDK instance
// with an authenticated customer session.

// ─── Conversations ───────────────────────────────────────────────

/** List conversations with cursor pagination */
async function listConversations(cursor?: string) {
  const params = new URLSearchParams({ limit: String(MESSAGES_PER_PAGE) })
  if (cursor) params.set("cursor", cursor)

  return sdk.client.fetch(`/store/messages?${params}`)
  // → { conversations: [...], next_cursor: string | null }
}

/** Create or resume a conversation with a seller */
async function startConversation(
  sellerId: string,
  message?: string,
  context?: { type: "product" | "order"; id: string }
) {
  return sdk.client.fetch("/store/messages", {
    method: "POST",
    body: {
      seller_id: sellerId,
      ...(message ? { body: message } : {}),
      ...(context ? { context_type: context.type, context_id: context.id } : {}),
    },
  })
  // → { conversation: {...}, message?: {...} }
}

// ─── Messages ────────────────────────────────────────────────────

/** Fetch messages with cursor pagination (newest first) */
async function getMessages(conversationId: string, cursor?: string) {
  const params = new URLSearchParams({ limit: String(MESSAGES_PER_PAGE) })
  if (cursor) params.set("cursor", cursor)

  return sdk.client.fetch(`/store/messages/${conversationId}?${params}`)
  // → { conversation: {...}, messages: [...], next_cursor: string | null }
}

/** Send a message in a conversation */
async function sendMessage(
  conversationId: string,
  body: string,
  context?: { type: "product" | "order"; id: string }
) {
  return sdk.client.fetch(`/store/messages/${conversationId}`, {
    method: "POST",
    body: {
      body,
      ...(context ? { context_type: context.type, context_id: context.id } : {}),
    },
  })
  // → { message: {...} }
}

/** Mark all seller messages as read */
async function markAsRead(conversationId: string) {
  return sdk.client.fetch(`/store/messages/${conversationId}/read`, {
    method: "POST",
    body: {},
  })
  // → { success: true, unread_count_customer: 0 }
}

/** Get total unread count across all conversations */
async function getUnreadCount() {
  return sdk.client.fetch("/store/messages/unread")
  // → { unread_count: number }
}

// ─── SSE Real-Time Connection ────────────────────────────────────

function createRealtimeConnection(handlers: {
  onNewMessage: (data: any) => void
  onMessagesRead: (data: any) => void
  onUnreadCount: (data: any) => void
  onConnected?: () => void
  onDisconnected?: () => void
}) {
  let eventSource: EventSource | null = null
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  let isIntentionallyClosed = false
  let reconnectDelay = 1000

  async function connect() {
    isIntentionallyClosed = false

    // Step 1: Obtain one-time token (authenticated)
    const { token } = await sdk.client.fetch("/store/messages/sse-token", {
      method: "POST",
    })

    // Step 2: Open SSE stream (token-based, unauthenticated)
    eventSource = new EventSource(
      `${BACKEND_URL}/store/messages/events?token=${token}`
    )

    eventSource.addEventListener("connected", () => {
      reconnectDelay = 1000 // Reset backoff on success
      handlers.onConnected?.()
    })

    eventSource.addEventListener("new_message", (e) => {
      handlers.onNewMessage(JSON.parse(e.data))
    })

    eventSource.addEventListener("messages_read", (e) => {
      handlers.onMessagesRead(JSON.parse(e.data))
    })

    eventSource.addEventListener("unread_count", (e) => {
      handlers.onUnreadCount(JSON.parse(e.data))
    })

    eventSource.addEventListener("reconnected", () => {
      reconnectDelay = 1000 // Reset backoff on reconnect
      // Server reconnected — refetch data to catch up
      handlers.onConnected?.()
    })

    eventSource.addEventListener("error", () => {
      handlers.onDisconnected?.()
      eventSource?.close()

      if (!isIntentionallyClosed) {
        // Exponential backoff: 1s, 2s, 4s, 8s, ..., max 30s
        reconnectTimeout = setTimeout(connect, reconnectDelay)
        reconnectDelay = Math.min(reconnectDelay * 2, 30000)
      }
    })
  }

  function disconnect() {
    isIntentionallyClosed = true
    if (reconnectTimeout) clearTimeout(reconnectTimeout)
    eventSource?.close()
    eventSource = null
  }

  return { connect, disconnect }
}

// ─── Accumulating Paginated Messages ─────────────────────────────

/**
 * Helper to manage paginated message loading.
 *
 * Accumulates pages as the user loads older messages.
 * Returns messages in chronological order for display.
 */
function createMessagePaginator(conversationId: string) {
  const pages: Array<{ messages: any[]; next_cursor: string | null }> = []

  async function loadInitial() {
    const page = await getMessages(conversationId)
    pages.length = 0  // reset
    pages.push(page)
    return getDisplayState()
  }

  async function loadOlder() {
    const lastPage = pages[pages.length - 1]
    if (!lastPage?.next_cursor) return getDisplayState()

    const page = await getMessages(conversationId, lastPage.next_cursor)
    pages.push(page)
    return getDisplayState()
  }

  function getDisplayState() {
    // All pages contain messages in desc order.
    // Later pages contain older messages.
    // Merge all and reverse for chronological display.
    const allMessages = pages.flatMap((p) => p.messages)
    const lastPage = pages[pages.length - 1]

    return {
      conversation: pages[0]?.conversation ?? null,
      messages: [...allMessages].reverse(),
      hasOlderMessages: lastPage?.next_cursor != null,
    }
  }

  return { loadInitial, loadOlder, getDisplayState }
}

// ─── Usage ───────────────────────────────────────────────────────

/*
// 1. Start a conversation from a product page
const { conversation } = await startConversation(
  "sel_01ABC",
  "Is this available in blue?",
  { type: "product", id: "prod_01XYZ" }
)

// 2. Load messages with pagination
const paginator = createMessagePaginator(conversation.id)
let state = await paginator.loadInitial()
// state.messages → chronological array of last 20 messages
// state.hasOlderMessages → true if more to load

// 3. Load older messages
state = await paginator.loadOlder()

// 4. Send a reply
await sendMessage(conversation.id, "Great, I'll order it!")

// 5. Mark as read when viewing
await markAsRead(conversation.id)

// 6. Connect SSE for real-time updates
const sse = createRealtimeConnection({
  onNewMessage: (data) => {
    if (data.conversation_id === currentConversationId) {
      // Refetch messages for current conversation
      paginator.loadInitial()
    }
    // Always refetch unread count
    getUnreadCount()
  },
  onMessagesRead: (data) => {
    // Update read receipts in the UI
  },
  onUnreadCount: (data) => {
    // Update badge count
  },
  onConnected: () => {
    // Refetch data to catch up after any missed events
    getUnreadCount()
  },
})

await sse.connect()

// 7. Disconnect on cleanup (e.g. logout, page unmount)
sse.disconnect()
*/
```

---

## Notes

- **Conversation uniqueness**: Only one conversation exists per buyer-seller pair. Creating a conversation with the same seller returns the existing one.
- **Message ordering**: The API always returns messages newest-first. Reverse for chronological display.
- **Cursor opacity**: Cursors are base64-encoded. Never parse, modify, or construct them — always use `next_cursor` from the response.
- **Soft deletes**: All entities support soft deletion. Deleted conversations/messages are excluded from API responses automatically.
- **GDPR**: The backend supports buyer data anonymization. When a customer account is deleted, their `buyer_id` is anonymized across all conversations and messages.
- **Redis dependency**: SSE, rate limiting, and content filter caching require Redis. If Redis is down, SSE won't connect and rate limiting is skipped, but core messaging (send/receive via REST) continues to work.
