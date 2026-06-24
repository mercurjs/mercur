# Messaging Plugin Documentation

Buyer-vendor messaging system with real-time SSE delivery, content filtering, admin oversight, chat blocking, GDPR erasure, cursor-based pagination, and dashboard UI for both vendor and admin panels.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Installation & Configuration](#installation--configuration)
3. [Modules](#modules)
   - [Messaging Module](#messaging-module)
   - [Messaging Filters Module](#messaging-filters-module)
   - [Messaging Redis Module](#messaging-redis-module)
4. [Data Models](#data-models)
5. [Module Links](#module-links)
6. [Workflows](#workflows)
7. [API Reference — Store (Customer)](#api-reference--store-customer)
8. [API Reference — Vendor (Seller)](#api-reference--vendor-seller)
9. [API Reference — Admin](#api-reference--admin)
10. [SSE Real-Time Event System](#sse-real-time-event-system)
11. [Cursor-Based Pagination](#cursor-based-pagination)
12. [Content Filtering](#content-filtering)
13. [Rate Limiting](#rate-limiting)
14. [Context Linking](#context-linking)
15. [Unread Tracking](#unread-tracking)
16. [GDPR & Data Privacy](#gdpr--data-privacy)
17. [Chat Blocking](#chat-blocking)
18. [Event Subscribers](#event-subscribers)
19. [Scheduled Jobs](#scheduled-jobs)
20. [Error Reference](#error-reference)
21. [Testing](#testing)
22. [Configuration Reference](#configuration-reference)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          API Layer                                  │
│  Store (Customer)          Vendor (Seller)          Admin           │
│  /store/messages/*         /vendor/messages/*        /admin/messages/*│
└──────────┬─────────────────────┬────────────────────────┬───────────┘
           │                     │                        │
           ▼                     ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Workflows                                    │
│  send-message  │  create-conversation  │  mark-messages-read        │
│  anonymize-buyer  │  anonymize-vendor  │  filter-rule CRUD          │
│  block-customer  │  unblock-customer                                │
└──────────┬──────────────────────────────────────────────────────────┘
           │
           ▼
┌────────────────────┐  ┌─────────────────────┐  ┌──────────────────┐
│  Messaging Module  │  │ Messaging Filters   │  │ Messaging Redis  │
│  - Conversation    │  │ - FilterRule        │  │ - Pub/Sub        │
│  - Message         │  │ - BlockedMessageLog │  │ - Rate Limiting  │
│  - ChatBlock       │  │ - Evaluation        │  │ - SSE Tokens     │
│  - CRUD + Cursors  │  │                     │  │                  │
└────────────────────┘  └─────────────────────┘  └──────────────────┘
           │                                              │
           ▼                                              ▼
      PostgreSQL                                        Redis
```

The plugin follows Medusa's architecture strictly:

- **Modules** handle data access and CRUD operations only
- **Workflows** contain all business logic, validation, and side effects
- **API Routes** handle HTTP concerns, delegate to workflows
- **Subscribers** react to domain events asynchronously
- **Scheduled Jobs** perform periodic maintenance

Three actor types interact with the system:

| Actor | Auth Method | Capabilities |
|-------|-------------|-------------|
| Customer (Buyer) | Session / Bearer | Create conversations, send messages, mark read, SSE via token |
| Seller (Vendor) | Session / Bearer | List conversations, reply, mark read, SSE via session |
| Admin | Session / Bearer | Search all conversations, manage filters, view blocked messages, block/unblock customers, SSE (all events) |

---

## Installation & Configuration

### Install the block

```bash
mercurjs add messaging
```

### Dependencies

| Dependency | Purpose |
|-----------|---------|
| `ioredis` | Redis client for pub/sub, rate limiting, SSE tokens |

Redis is **optional but strongly recommended**. Without it, SSE, rate limiting, and notification throttling are disabled. Core REST messaging (send, receive, mark read) and content filtering continue to work.

### Environment variables

```
REDIS_URL=redis://localhost:6379
```

### Module registration

```typescript
// medusa-config.ts
module.exports = defineConfig({
  modules: [
    { resolve: "./modules/messaging" },
    { resolve: "./modules/messaging-filters" },
    {
      resolve: "./modules/messaging-redis",
      options: { redisUrl: process.env.REDIS_URL },
    },
  ],
})
```

### Run migrations

```bash
npx medusa db:migrate
```

This creates the `conversation`, `message`, `chat_block`, `filter_rule`, and `blocked_message_log` tables.

---

## Modules

### Messaging Module

**Identifier**: `messaging`

Core module handling conversations and messages. Provides cursor-based pagination, atomic message creation, and atomic read marking.

#### Service: `MessagingModuleService`

```typescript
// Cursor-paginated conversation listing
listConversationsCursor(
  filter: { buyer_id?: string; seller_id?: string },
  pagination: { cursor?: string; limit?: number }
): Promise<{ data: ConversationDTO[]; next_cursor: string | null }>

// Cursor-paginated message listing (descending order)
listMessagesCursor(
  conversationId: string,
  pagination: { cursor?: string; limit?: number }
): Promise<{ data: MessageDTO[]; next_cursor: string | null }>

// Admin search with filtering across seller/buyer names, dates, context
searchConversationsAdmin(
  filter: {
    seller_name?: string; buyer_name?: string;
    date_from?: string; date_to?: string;
    context_type?: string; context_id?: string
  },
  pagination: { cursor?: string; limit?: number }
): Promise<{ data: ConversationDTO[]; next_cursor: string | null }>

// Total unread count across all conversations for a user
getUnreadCountTotal(
  filter: { buyer_id?: string; seller_id?: string }
): Promise<number>

// Atomic: creates message + updates conversation metadata + increments unread
createMessageAtomic(data: {
  conversation_id: string; sender_id: string; sender_type: SenderType;
  body: string; context_type?: string; context_id?: string; context_label?: string;
}): Promise<MessageDTO>

// Atomic: marks opposite-party messages as read + resets unread counter
markMessagesReadAtomic(
  conversationId: string,
  readerType: "customer" | "seller"
): Promise<number>  // count of messages marked

// Cursor encoding/decoding
encodeCursor(values: Record<string, string | number | null>): string
decodeCursor(cursor: string): Record<string, string | number | null> | null
```

```typescript
// Batch check which buyer IDs are chat-blocked (single WHERE IN query)
checkBuyersBlocked(
  buyerIds: string[]
): Promise<Set<string>>
```

Also inherits standard `MedusaService` CRUD methods: `listConversations`, `createConversations`, `updateConversations`, `deleteConversations`, `listMessages`, `createMessages`, `updateMessages`, `deleteMessages`, `listChatBlocks`, `createChatBlocks`, `deleteChatBlocks`.

---

### Messaging Filters Module

**Identifier**: `messagingFilters`

Manages content filter rules and blocked message logging. Compiles rules into an optimized in-memory structure for fast evaluation.

#### Service: `MessagingFiltersModuleService`

```typescript
// Evaluate a message body against the compiled ruleset
evaluateMessage(
  body: string,
  ruleset: CompiledRuleset
): FilterEvaluationResult
// Returns: { matched: boolean, rule_id?, match_type?, pattern? }
// Priority: exact > contains > regex (short-circuits on first match)
```

Inherits standard CRUD: `listFilterRules`, `createFilterRules`, `updateFilterRules`, `deleteFilterRules`, `listAndCountFilterRules`, `listAndCountBlockedMessageLogs`, `createBlockedMessageLogs`.

#### Compiled Ruleset Structure

```typescript
interface CompiledRuleset {
  exactWords: Set<string>       // Lowercase words for O(1) lookup
  exactRules: Map<string, string> // word → rule_id
  containsPatterns: Array<{ id: string; pattern: string }>  // Lowercase
  regexPatterns: Array<{ id: string; regex: RegExp }>
}
```

Compilation happens at module startup and is recompiled when rules change via admin CRUD workflows. Each workflow step (`invalidateFilterCacheStep`) recompiles the local in-memory cache and publishes to the Redis `filter_rules_changed` channel for future cross-instance support. Currently, filter recompilation is per-instance only — if running multiple instances, a restart or rule change on each instance is needed to refresh the cache.

#### Built-in Filter Rules

Seeded automatically on first startup:

| Rule | Type | Pattern | Purpose |
|------|------|---------|---------|
| Email addresses | Regex | `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}` | Keep communication on-platform |
| Phone numbers | Regex | Various international formats | Prevent off-platform contact |
| URLs | Regex | `https?://[^\s]+\|www\.[^\s]+` | Block spam and phishing |

Built-in rules cannot be deleted or have their pattern modified. Only `is_enabled` and `description` can be changed.

---

### Messaging Redis Module

**Identifier**: `messagingRedis`

Provides Redis-backed infrastructure for real-time features. All methods degrade gracefully if Redis is unavailable.

#### Service: `MessagingRedisModuleService`

```typescript
// Connection status
get isAvailable(): boolean

// SSE token management (one-time tokens with TTL)
setToken(token: string, value: string, ttlSeconds: number): Promise<void>
consumeToken(token: string): Promise<string | null>  // Deletes after reading

// Sliding window rate limiting
checkRateLimit(
  key: string, limit: number, windowSeconds: number
): Promise<{ allowed: boolean; count: number }>

// Pub/Sub
publish(channel: string, data: Record<string, unknown>): Promise<void>
createSubscriber(): Redis | null

// Notification throttle (SET NX EX)
trySetThrottle(key: string, ttlSeconds: number): Promise<boolean>
```

#### Redis Connection

```typescript
// Connection options
{
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy: exponential backoff (max 5 retries, 2000ms cap)
}
```

If `REDIS_URL` is not provided or connection fails, the module registers a null connection and all Redis-dependent features are silently skipped.

---

## Data Models

### Conversation

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | string | Primary key, prefix: `conv` |
| `buyer_id` | string | Required |
| `seller_id` | string | Required |
| `last_message_preview` | string \| null | Max 100 chars, auto-truncated |
| `last_message_sender_type` | `"customer"` \| `"seller"` \| null | |
| `last_message_at` | datetime \| null | Updated on each message |
| `unread_count_customer` | number | Default: 0 |
| `unread_count_seller` | number | Default: 0 |
| `created_at` | datetime | Auto |
| `updated_at` | datetime | Auto |
| `deleted_at` | datetime \| null | Soft delete |

**Indexes**:
- `UNIQUE (buyer_id, seller_id)` — one conversation per buyer-seller pair
- `(seller_id, last_message_at, id)` — vendor conversation listing
- `(buyer_id, last_message_at, id)` — buyer conversation listing

**Relationship**: `messages` — hasMany → Message

### Message

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | string | Primary key, prefix: `msg` |
| `conversation_id` | string | Foreign key → Conversation |
| `sender_id` | string | Customer or seller ID |
| `sender_type` | `"customer"` \| `"seller"` | |
| `body` | string | 1–2000 characters |
| `context_type` | `"product"` \| `"order"` \| null | |
| `context_id` | string \| null | Product or order ID |
| `context_label` | string \| null | Resolved label (product title or "Order #XYZ") |
| `read_at` | datetime \| null | Set when recipient reads |
| `created_at` | datetime | Auto |
| `updated_at` | datetime | Auto |
| `deleted_at` | datetime \| null | Soft delete |

**Indexes**:
- `(conversation_id, created_at, id)` — message pagination within conversation
- `(context_type, context_id)` — context lookups
- `(created_at)` — global ordering

### FilterRule

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | string | Primary key, prefix: `filt` |
| `match_type` | `"exact"` \| `"contains"` \| `"regex"` | Custom rules: only `exact` or `contains` |
| `pattern` | string | 1–500 characters |
| `is_builtin` | boolean | Default: false. Built-in rules protected |
| `is_enabled` | boolean | Default: true |
| `description` | string \| null | Max 500 characters |
| `created_at` | datetime | Auto |
| `updated_at` | datetime | Auto |
| `deleted_at` | datetime \| null | Soft delete |

### BlockedMessageLog

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | string | Primary key, prefix: `bml` |
| `sender_id` | string | Who sent the blocked message |
| `sender_type` | `"customer"` \| `"seller"` | |
| `conversation_id` | string | Where it was sent |
| `matched_rule_id` | string | Which rule blocked it |
| `message_body` | string | Full original message text |
| `created_at` | datetime | Auto |
| `updated_at` | datetime | Auto |
| `deleted_at` | datetime \| null | Soft delete |

**Retention**: 30 days (cleaned up daily at 4 AM).

### ChatBlock

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | string | Primary key, prefix: `cblk` |
| `customer_id` | string | Required |
| `blocked_by` | string | Admin user ID who blocked |
| `reason` | string \| null | Optional reason for blocking |
| `created_at` | datetime | Auto |
| `updated_at` | datetime | Auto |
| `deleted_at` | datetime \| null | Soft delete |

**Indexes**:
- `UNIQUE (customer_id)` where `deleted_at IS NULL` — one active block per customer

A customer is either blocked or not — blocking is account-wide for chat (not per-conversation). The `blocked_by` field provides admin accountability. The unique index with a `deleted_at IS NULL` condition allows re-blocking after unblocking without conflicts.

---

## Module Links

### Conversation ↔ Customer

Links the `customer` module to `conversation`. One customer has many conversations. Enables `query.graph()` traversal from customer to their conversations.

### Conversation ↔ Seller

Links the `seller` module to `conversation`. One seller has many conversations. Enables `query.graph()` traversal from seller to their conversations.

---

## Workflows

### `sendMessageWorkflow`

Creates a message in a conversation with full validation pipeline.

**Input**:
```typescript
{
  conversation_id: string
  sender_id: string
  sender_type: "customer" | "seller"
  body: string                        // 1–2000 chars
  context_type?: "product" | "order"
  context_id?: string
  context_label?: string              // Pre-resolved by route
  recipient_id: string
  is_new_conversation: boolean
}
```

**Steps**:
1. **validateChatBlockStep** — Checks if the customer (buyer) in this conversation is chat-blocked. Blocks both directions: blocked customers cannot send, and no one can send to a blocked customer.
2. **validateRateLimitStep** — Checks 10 msg/60s and (if new conversation) 5 conv/3600s
3. **validateContentFilterStep** — Evaluates against compiled ruleset, logs blocked
4. **createMessageStep** — Atomic insert + conversation metadata update + unread increment
5. **publishMessageEventStep** — Publishes `new_message` to Redis pub/sub
6. **emitEventStep** — Emits `messaging.message.created` Medusa event

**Output**: `MessageDTO`

**Compensation**: Step 3 deletes the message on rollback.

---

### `createConversationWorkflow`

Creates a new buyer-seller conversation with module links.

**Input**: `{ buyer_id: string, seller_id: string }`

**Steps**:
1. **createConversationStep** — Creates conversation (unique constraint on buyer_id + seller_id)
2. **createRemoteLinkStep** — Links conversation to customer and seller modules

**Output**: `ConversationDTO`

**Compensation**: Step 1 deletes the conversation on rollback.

---

### `markMessagesReadWorkflow`

Marks all unread messages from the opposite party as read and publishes notification events.

**Input**:
```typescript
{
  conversation_id: string
  reader_id: string
  reader_type: "customer" | "seller"
  sender_id: string                   // The opposite party
}
```

**Steps**:
1. **markMessagesReadStep** — Atomic: sets `read_at` on unread messages + resets reader's unread count
2. **publishMessageEventStep** (`messages_read`) — Notifies sender their messages were read
3. **publishMessageEventStep** (`unread_count`) — Confirms count reset to reader

**Output**: `{ conversation_id, updated: number }`

---

### `anonymizeBuyerMessagesWorkflow`

GDPR right-to-erasure handler for buyer deletion.

**Input**: `{ buyer_id: string }`

**Steps**:
1. Find all conversations where `buyer_id` matches (paginated, batch size: 100)
2. Update `buyer_id` to `deleted_{buyer_id}`
3. Set all message bodies to `"[Message removed]"` (paginated, batch size: 100)

**Compensation**:
- Step 1 (find conversations): restores original `buyer_id` on all matched conversations
- Step 2 (anonymize messages): logs a warning — message body replacement is irreversible

---

### `anonymizeVendorMessagesWorkflow`

Vendor offboarding handler.

**Input**: `{ seller_id: string }`

**Steps**:
1. Find all conversations where `seller_id` matches (paginated, batch size: 100)
2. Update `seller_id` to `deleted_{seller_id}`
3. **Message bodies are preserved** (vendor content remains per specification)

**Compensation**:
- Step 1 (find conversations): restores original `seller_id` on all matched conversations

---

### Filter Rule Workflows

| Workflow | Input | Behavior |
|----------|-------|----------|
| `createFilterRuleWorkflow` | `{ match_type, pattern, description?, is_enabled? }` | Creates rule, rejects regex type, invalidates cache |
| `updateFilterRuleWorkflow` | `{ id, match_type?, pattern?, description?, is_enabled? }` | Updates rule, blocks pattern change on built-in rules |
| `deleteFilterRuleWorkflow` | `{ id }` | Soft-deletes rule, blocks deletion of built-in rules |

All three recompile the local in-memory filter cache and publish `filter_rules_changed` to Redis (best-effort, for future cross-instance support).

---

### `blockCustomerWorkflow`

Blocks a customer from chat. Idempotent — blocking an already-blocked customer returns the existing block record.

**Input**:
```typescript
{
  customer_id: string    // Customer to block
  blocked_by: string     // Admin user ID performing the block
  reason?: string | null // Optional reason
}
```

**Steps**:
1. **blockCustomerStep** — Checks for existing block (idempotent). If none exists, creates a `ChatBlock` record.

**Output**: `ChatBlockDTO`

**Compensation**: Deletes the created block record on rollback.

---

### `unblockCustomerWorkflow`

Removes a chat block from a customer. Succeeds silently if the customer is not blocked.

**Input**:
```typescript
{
  customer_id: string    // Customer to unblock
}
```

**Steps**:
1. **unblockCustomerStep** — Finds and soft-deletes the existing `ChatBlock` record.

**Output**: `null`

**Compensation**: Re-creates the deleted block record on rollback.

---

## API Reference — Store (Customer)

All store endpoints require customer authentication via session or bearer token.

### `POST /store/messages` — Create conversation

Creates a new conversation with a seller (or returns existing) and optionally sends the first message.

**Request body**:
```typescript
{
  seller_id: string          // Required
  body?: string              // 1–2000 chars, optional
  context_type?: "product" | "order"   // Optional
  context_id?: string        // Required if context_type set
}
```

Validation: `context_type` and `context_id` must both be set or both omitted.

**Response** `200`:
```typescript
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
  message?: {
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

**Behavior**:
- **Block check**: If the customer is chat-blocked, returns `not_allowed` error before any conversation/message processing
- If conversation exists between buyer and seller, returns it (no duplicate)
- If `body` provided: validates block → validates rate limit → validates content filter → creates message
- Resolves context labels: product title or "Order #display_id"

---

### `GET /store/messages` — List conversations

**Query parameters**:

| Param | Type | Default | Range |
|-------|------|---------|-------|
| `cursor` | string | — | Opaque cursor |
| `limit` | number | 20 | 1–50 |

**Response** `200`:
```typescript
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
  next_cursor: string | null
}
```

Ordered by `last_message_at DESC, id DESC`.

---

### `GET /store/messages/:id` — Get messages

**Query parameters**:

| Param | Type | Default | Range |
|-------|------|---------|-------|
| `cursor` | string | — | Opaque cursor |
| `limit` | number | 20 | 1–100 |

**Response** `200`:
```typescript
{
  conversation: ConversationDTO
  messages: Array<{
    id: string
    sender_type: "customer" | "seller"
    body: string
    context_type: "product" | "order" | null
    context_id: string | null
    context_label: string | null
    read_at: string | null
    created_at: string
  }>
  next_cursor: string | null
}
```

Messages returned in **descending order** (newest first). Reverse for chronological display.

**Ownership check**: `conversation.buyer_id` must match authenticated customer.

---

### `POST /store/messages/:id` — Send message

**Request body**:
```typescript
{
  body: string               // 1–2000 chars, required
  context_type?: "product" | "order"
  context_id?: string
}
```

**Response** `200`:
```typescript
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

**Pipeline**: ownership check → **block check** → rate limit → content filter → create message → publish SSE → emit event.

---

### `POST /store/messages/:id/read` — Mark as read

**Request body**: `{}` (empty)

**Response** `200`:
```typescript
{
  success: true
  unread_count_customer: 0
}
```

Marks all unread seller messages as read. Publishes `messages_read` event to seller and `unread_count` event to customer.

---

### `GET /store/messages/unread` — Unread count

**Response** `200`:
```typescript
{
  unread_count: number
}
```

Total unread messages across all conversations for the authenticated customer.

---

### `POST /store/messages/sse-token` — Get SSE token

**Response** `200`:
```typescript
{
  token: string       // UUID, one-time use
  expires_in: 30      // seconds
}
```

Token stored in Redis: `sse_token:{token} = customer_id` with 30-second TTL. Consumed (deleted) on first SSE connection.

---

### `GET /store/messages/events?token={token}` — SSE stream

**Auth**: Token-based (no session required). See [SSE Real-Time Event System](#sse-real-time-event-system).

---

## API Reference — Vendor (Seller)

All vendor endpoints require seller authentication.

### `GET /vendor/messages` — List conversations

**Query parameters**: `cursor?`, `limit?` (1–50, default 20)

**Response** `200`:
```typescript
{
  conversations: Array<ConversationDTO & {
    buyer_first_name: string | null   // Enriched
    is_buyer_blocked: boolean          // Chat block status
  }>
  next_cursor: string | null
}
```

---

### `GET /vendor/messages/:id` — Get messages

**Query parameters**: `cursor?`, `limit?` (1–100, default 30)

**Response** `200`:
```typescript
{
  conversation: ConversationDTO & {
    buyer_first_name: string | null
    is_buyer_blocked: boolean
  }
  messages: MessageDTO[]
  next_cursor: string | null
  buyer_orders: Array<{
    id: string
    display_id: number
    status: string
    total: number
    currency_code: string
    created_at: string
  }>
}
```

The `buyer_orders` array contains the buyer's recent orders with this seller, enabling contextual customer support.

---

### `POST /vendor/messages/:id` — Send reply

**Request body**:
```typescript
{
  body: string   // 1–2000 chars, required
}
```

Vendor replies have no context linking (no `context_type` / `context_id`).

**Block enforcement**: If the buyer is chat-blocked, the vendor cannot send a reply. Returns `not_allowed` error: "Cannot send messages to a blocked customer".

**Response** `200`: `{ message: MessageDTO }`

---

### `POST /vendor/messages/:id/read` — Mark as read

**Response** `200`: `{ success: true, unread_count_seller: 0 }`

---

### `GET /vendor/messages/unread` — Unread count

**Response** `200`: `{ unread_count: number }`

---

### `GET /vendor/messages/events` — SSE stream

Direct session-based auth (no token exchange). See [SSE Real-Time Event System](#sse-real-time-event-system).

---

## API Reference — Admin

All admin endpoints require admin user authentication. Admin has **read-only** access to conversations (cannot send messages) and can manage customer chat blocks.

### `GET /admin/messages` — Search conversations

**Query parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `cursor` | string | Pagination cursor |
| `limit` | number (1–50, default 20) | Page size |
| `seller_name` | string | LIKE filter on seller name |
| `buyer_name` | string | LIKE filter on customer first or last name |
| `date_from` | string (ISO datetime) | Filter: last_message_at >= |
| `date_to` | string (ISO datetime) | Filter: last_message_at <= |
| `context_type` | `"product"` \| `"order"` | Filter by message context type |
| `context_id` | string | Filter by specific product/order ID |

**Response** `200`:
```typescript
{
  conversations: Array<ConversationDTO & {
    seller_name?: string
    buyer_name?: string
    buyer_email?: string
    is_buyer_blocked: boolean
  }>
  next_cursor: string | null
}
```

---

### `GET /admin/messages/:id` — Get messages

**Response** `200`:
```typescript
{
  conversation: ConversationDTO & {
    buyer_name: string | null
    buyer_email: string | null
    seller_name: string | null
    is_buyer_blocked: boolean
    block_reason: string | null   // Present when is_buyer_blocked is true
  }
  messages: MessageDTO[]    // includes sender_id
  next_cursor: string | null
}
```

Admin can view any conversation without ownership restrictions. Admin message fields include `sender_id` (not exposed in store/vendor responses).

---

### `GET /admin/messages/filters` — List filter rules

**Query parameters**: `limit?` (1–50, default 20)

**Response** `200`:
```typescript
{
  filter_rules: Array<{
    id: string
    match_type: "exact" | "contains" | "regex"
    pattern: string
    is_builtin: boolean
    is_enabled: boolean
    description: string | null
    created_at: string
    updated_at: string
  }>
  count: number
}
```

---

### `POST /admin/messages/filters` — Create filter rule

**Request body**:
```typescript
{
  match_type: "exact" | "contains"   // "regex" not allowed for custom rules
  pattern: string                     // 1–500 chars
  description?: string                // Max 500 chars
  is_enabled?: boolean                // Default: true
}
```

**Response** `200`: `{ filter_rule: FilterRuleDTO }`

Takes effect immediately (cache invalidated).

---

### `POST /admin/messages/filters/:id` — Update filter rule

**Request body**:
```typescript
{
  match_type?: "exact" | "contains"
  pattern?: string
  description?: string
  is_enabled?: boolean
}
```

**Constraints**:
- Built-in rules: only `is_enabled` and `description` can be changed
- Attempting to modify a built-in rule's `pattern` or `match_type` returns `not_allowed`

**Response** `200`: `{ filter_rule: FilterRuleDTO }`

---

### `DELETE /admin/messages/filters/:id` — Delete filter rule

Built-in rules cannot be deleted (returns `not_allowed`).

**Response** `200`: `{ id: string, deleted: true }`

---

### `GET /admin/messages/blocked` — List blocked messages

**Query parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `cursor` | string | Pagination cursor |
| `limit` | number (1–50, default 20) | Page size |
| `sender_type` | `"customer"` \| `"seller"` | Filter by sender type |
| `date_from` | string | Filter: created_at >= |
| `date_to` | string | Filter: created_at <= |

**Response** `200`:
```typescript
{
  blocked_messages: Array<{
    id: string
    sender_id: string
    sender_type: "customer" | "seller"
    conversation_id: string
    matched_rule_id: string
    message_body: string
    created_at: string
  }>
  count: number
}
```

---

### `POST /admin/messages/chat-blocks` — Block customer from chat

**Request body**:
```typescript
{
  customer_id: string      // Required, customer to block
  reason?: string          // Optional, max 500 chars
}
```

**Response** `201`:
```typescript
{
  block: {
    id: string
    customer_id: string
    blocked_by: string      // Admin user ID who performed the block
    reason: string | null
    created_at: string
    updated_at: string
  }
}
```

**Behavior**:
- Idempotent: blocking an already-blocked customer returns the existing block record
- The `blocked_by` field is set from the authenticated admin's ID
- Takes effect immediately — blocked customer cannot create conversations or send messages
- Vendors cannot send messages to the blocked customer

---

### `GET /admin/messages/chat-blocks/:customer_id` — Check block status

**Response** `200`:
```typescript
{
  is_blocked: boolean
}
```

---

### `DELETE /admin/messages/chat-blocks/:customer_id` — Unblock customer

**Response** `200`:
```typescript
{
  success: true
}
```

Succeeds silently if the customer is not currently blocked.

---

### `GET /admin/messages/events` — SSE stream

Direct session-based auth. Admin receives **all** messaging events globally (no filtering by recipient).

---

## SSE Real-Time Event System

The plugin uses Server-Sent Events (SSE) over Redis pub/sub to deliver real-time updates to connected clients. All events are published to a single Redis channel (`messaging`) and filtered per-subscriber.

### Connection Flows

| Actor | Endpoint | Auth Method | Filtering |
|-------|----------|-------------|-----------|
| Customer | `GET /store/messages/events?token={token}` | One-time token (30s TTL) | Events where `recipient_id` or `sender_id` matches customer |
| Vendor | `GET /vendor/messages/events` | Session/bearer | Events where `recipient_id` or `sender_id` matches seller |
| Admin | `GET /admin/messages/events` | Session/bearer | **No filtering** — receives all events |

#### Store SSE Token Flow

`EventSource` cannot send custom headers, so store SSE uses a token exchange:

1. `POST /store/messages/sse-token` (authenticated) → returns `{ token, expires_in: 30 }`
2. Token stored in Redis: `sse_token:{token} = customer_id` (30s TTL)
3. `GET /store/messages/events?token={token}` (unauthenticated) — token consumed on connection
4. Token is **one-time use** — deleted from Redis after first consumption

### Event Types

#### `connected`

Sent immediately on successful SSE connection.

```
event: connected
data: {"status":"connected"}
```

#### `reconnected`

Sent when client reconnects with `Last-Event-ID` header.

```
event: reconnected
data: {"status":"reconnected","last_event_id":"..."}
```

#### `new_message`

Published when a message is created in any conversation the subscriber is part of.

```
event: new_message
data: {
  "conversation_id": "conv_01ABC",
  "recipient_id": "cus_01XYZ",
  "sender_type": "customer",
  "event_type": "new_message",
  "message_id": "msg_01DEF",
  "context_type": "product",
  "context_label": "Blue Widget"
}
```

#### `messages_read`

Published when the other party marks messages as read.

```
event: messages_read
data: {
  "conversation_id": "conv_01ABC",
  "event_type": "messages_read"
}
```

#### `unread_count`

Published when a user's unread count changes (after mark-read or new message).

```
event: unread_count
data: {
  "conversation_id": "conv_01ABC",
  "event_type": "unread_count",
  "unread_count": 3
}
```

#### Heartbeat

A comment-only frame sent every 30 seconds to keep the connection alive:

```
:heartbeat
```

### Reconnection

- `EventSource` auto-reconnects and sends `Last-Event-ID` header
- Server sends `reconnected` event but does **not** replay missed events
- Clients should refetch conversations/messages after reconnection to catch up
- Store SSE: token is consumed, so reconnection requires a new token
- Dashboard SSE hooks use **exponential backoff** on error: 1s → 2s → 4s → 8s → ... → max 30s, reset to 1s on successful connection

### Graceful Degradation

If Redis is unavailable, SSE connections cannot be established. Clients should fall back to polling the REST endpoints.

---

## Cursor-Based Pagination

All list endpoints use cursor-based pagination for consistent performance regardless of dataset size.

### How It Works

Cursors are **opaque base64url-encoded JSON** strings containing the sort fields of the last item in the current page. They encode `{ field_value, id }` for deterministic ordering.

| Entity | Cursor Fields | Sort Order |
|--------|--------------|------------|
| Conversations | `last_message_at`, `id` | DESC (most recent first) |
| Messages | `created_at`, `id` | DESC (newest first) |

### Pagination Limits

| Endpoint Type | Default | Max |
|--------------|---------|-----|
| Conversation lists | 20 | 50 |
| Message lists | 20 | 100 |

### Usage Pattern

```
# First page
GET /store/messages?limit=20
→ { conversations: [...], next_cursor: "eyJ..." }

# Next page
GET /store/messages?limit=20&cursor=eyJ...
→ { conversations: [...], next_cursor: "eyJ..." }

# Last page
GET /store/messages?limit=20&cursor=eyJ...
→ { conversations: [...], next_cursor: null }
```

`next_cursor` is `null` when there are no more items. Cursors are opaque — never parse, modify, or construct them client-side.

---

## Content Filtering

Every message (from both customers and sellers) passes through the content filter before being accepted.

### Evaluation Pipeline

1. **Exact word match** — Body split by whitespace, each word checked against `Set<string>` (O(1) per word, case-insensitive)
2. **Contains/substring match** — Body checked against each pattern (lowercased, O(n) per pattern)
3. **Regex match** — Body matched against compiled patterns (built-in rules only)

Evaluation short-circuits on first match. Priority: exact > contains > regex.

### Rule Types

| Type | Available To | Matching |
|------|-------------|----------|
| `exact` | Admin (custom) | Case-insensitive whole-word match |
| `contains` | Admin (custom) | Case-insensitive substring match |
| `regex` | Built-in only | Case-insensitive regex pattern |

### When a Message Is Blocked

1. Message is **not** created (rejected before insert)
2. Full message body logged in `blocked_message_log` with matched rule ID
3. API returns `400` with error type `invalid_data`
4. Blocked message logs retained for 30 days, cleaned up by scheduled job

### Cache Management

- Rules compiled into memory at startup (via module loader)
- Lazily compiled on first message if startup compilation fails
- Recompiled on the current instance when any rule changes (create/update/delete) via `invalidateFilterCacheStep`
- The step also publishes to Redis `filter_rules_changed` channel for future cross-instance support
- **Note**: Cross-instance invalidation requires a custom subscriber at the app level — not included by default due to MedusaJS module container limitations
- Functions: `getCompiledRuleset()`, `invalidateRuleset()`, `recompileFilters()`

---

## Rate Limiting

Enforced via Redis sliding window counters. Applies equally to customers and sellers.

| Limit | Threshold | Window | Redis Key |
|-------|-----------|--------|-----------|
| Messages per sender | 20 | 60 seconds | `ratelimit:msg:{sender_id}` |
| New conversations per sender | 5 | 3600 seconds (1 hour) | `ratelimit:conv:{sender_id}` |

### Behavior

- Implemented in `validateRateLimitStep` within `sendMessageWorkflow`
- Uses `INCR` + `EXPIRE` for atomic sliding window
- Conversation rate limit only checked when `is_new_conversation: true`
- Exceeding limit throws `MedusaError.Types.NOT_ALLOWED`
- **Graceful degradation**: If Redis unavailable, rate limiting is skipped entirely
- Window is sliding (resets based on first message in window, not fixed clock)

---

## Context Linking

Messages can be linked to a product or order, providing conversational context (e.g. "Question about this product", "Issue with order #1042").

### Resolution

When a message includes `context_type` and `context_id`, the API route resolves a `context_label` before passing to the workflow:

| Context Type | Resolution | Label Format |
|-------------|-----------|--------------|
| `product` | Fetches product by ID | Product title (e.g. "Blue Cotton T-Shirt") |
| `order` | Fetches order by ID | `"Order #<display_id>"` (e.g. "Order #1042") |

### Rules

- `context_type` and `context_id` must both be provided or both omitted
- Referenced product/order must exist (returns `404` otherwise)
- Label is resolved at send time and persisted — remains stable even if product title changes
- Different messages in the same conversation can reference different products/orders
- Vendor replies do not support context linking

---

## Unread Tracking

### Per-Conversation Counters

Each conversation tracks two independent unread counters:

- `unread_count_customer` — messages from seller that the customer hasn't read
- `unread_count_seller` — messages from customer that the seller hasn't read

### Counter Behavior

| Action | Customer Counter | Seller Counter |
|--------|-----------------|----------------|
| Customer sends message | No change | +1 |
| Seller sends message | +1 | No change |
| Customer marks read | → 0 | No change |
| Seller marks read | No change | → 0 |

Counters are updated **atomically** within the same database transaction as message creation or read marking.

### Total Unread

`GET /store/messages/unread` and `GET /vendor/messages/unread` return the **sum** of unread counts across all conversations for the authenticated user.

### Reconciliation

A scheduled job runs daily at 3 AM to reconcile drifted counters by counting actual unread messages and correcting any discrepancies.

---

## GDPR & Data Privacy

### Buyer Deletion

When a `customer.deleted` event fires:

1. `anonymizeBuyerMessagesWorkflow` runs automatically
2. All conversations: `buyer_id` → `deleted_{original_buyer_id}` (paginated, 100 per batch)
3. All buyer messages: `body` → `"[Message removed]"` (paginated, 100 per batch)
4. Module links to customer entity are cleaned up
5. Compensation: conversation `buyer_id` can be restored; message body anonymization is irreversible (logged)

### Vendor Deletion

When a `seller.deleted` event fires:

1. `anonymizeVendorMessagesWorkflow` runs automatically
2. All conversations: `seller_id` → `deleted_{original_seller_id}` (paginated, 100 per batch)
3. **Vendor message bodies are preserved** (per business specification)
4. Module links to seller entity are cleaned up
5. Compensation: conversation `seller_id` can be restored

### Data Retention

- Message data: retained indefinitely (soft delete only)
- Blocked message logs: 30-day retention, cleaned daily at 4 AM
- SSE tokens: 30-second TTL, auto-expired by Redis
- Rate limit counters: auto-expired by Redis (60s / 3600s TTL)

---

## Chat Blocking

Admin-only feature to suspend a customer's chat access. Blocking prevents the customer from creating new conversations and sending messages, and prevents vendors from sending messages to the blocked customer. The customer's storefront account is unaffected.

### How It Works

1. **Admin blocks customer** via `POST /admin/messages/chat-blocks` (with optional reason)
2. A `ChatBlock` record is created with a unique index on `customer_id`
3. Block is enforced at three layers (defense in depth):
   - **Route level**: Early exit before workflow execution (store and vendor POST handlers)
   - **Workflow step**: `validateChatBlockStep` runs first in `sendMessageWorkflow`
   - **UI level**: Compose area disabled in vendor dashboard, admin dashboard shows badge

### Block Enforcement Matrix

| Scenario | Result |
|----------|--------|
| Blocked customer creates conversation | `not_allowed`: "Your chat access has been suspended" |
| Blocked customer sends message | `not_allowed`: "Your chat access has been suspended" |
| Vendor sends to blocked customer | `not_allowed`: "Cannot send messages to a blocked customer" |
| Non-blocked customer sends message | Allowed (normal flow) |
| Admin blocks already-blocked customer | Idempotent — returns existing block |
| Admin unblocks non-blocked customer | Succeeds silently |

### Bidirectional Blocking

When a customer is blocked, **both directions** are blocked:
- The customer cannot send messages to any vendor
- No vendor can send messages to the blocked customer

This prevents vendors from unknowingly engaging with a blocked user.

### UI Indicators

| Dashboard | Location | Indicator |
|-----------|----------|-----------|
| Admin list | Next to buyer name | Red "Blocked" badge |
| Admin detail | Sidebar + dedicated section | Red "Blocked" badge + Block/Unblock button |
| Vendor list | Next to buyer name | Red "Blocked" badge |
| Vendor detail | Sidebar + compose area | Red "Blocked" badge + disabled compose with notice |

### Admin Block Dialog

The admin detail page provides:
- **Block action**: Opens an inline dialog with an optional reason input field and confirm/cancel buttons
- **Unblock action**: Shows a confirmation prompt via `usePrompt` before proceeding

### Security

- Only admin users can create or remove blocks (no vendor or store routes for block management)
- `blocked_by` field records which admin performed the block
- Block is enforced redundantly at route level, workflow level, and UI level

---

## Event Subscribers

### `messaging.message.created`

**Handler**: `message-notification.ts`

Triggered on every new message. Sends an email notification to the recipient.

**Logic**:
1. Checks notification throttle: one email per conversation per recipient per 15 minutes (Redis key: `notify:{conversation_id}:{recipient_id}`, TTL: 900s)
2. Resolves sender name (customer first name or seller name)
3. Resolves recipient email address
4. Sends notification via Medusa notification module
   - Template: `messaging-new-message`
   - Data: `{ sender_name, conversation_id }`
   - **Privacy**: Message body is never included in emails

### `customer.deleted`

**Handler**: `buyer-deletion.ts`

Runs `anonymizeBuyerMessagesWorkflow`. See [GDPR & Data Privacy](#gdpr--data-privacy).

### `seller.deleted`

**Handler**: `vendor-removal.ts`

Runs `anonymizeVendorMessagesWorkflow`. See [GDPR & Data Privacy](#gdpr--data-privacy).

---

## Scheduled Jobs

### Reconcile Unread Counts

**Schedule**: `0 3 * * *` (daily at 3 AM)

Iterates through all conversations in batches of 500. For each conversation, counts actual unread messages for both parties. If the stored counter differs from the actual count, updates it. Logs all corrections.

### Cleanup Blocked Messages

**Schedule**: `0 4 * * *` (daily at 4 AM)

Soft-deletes `blocked_message_log` entries older than 30 days. Logs the number of records cleaned up.

---

## Error Reference

| HTTP | Error Type | Cause | When |
|------|-----------|-------|------|
| 400 | `invalid_data` | Request validation failed | Missing/invalid fields, body too long/short |
| 400 | `invalid_data` | Content filter matched | Message contains blocked content |
| 400 | `not_allowed` | Rate limit exceeded | Too many messages or conversations in window |
| 400 | `not_allowed` | Chat blocked (customer) | Blocked customer attempts to create conversation or send message |
| 400 | `not_allowed` | Chat blocked (vendor) | Vendor attempts to send message to blocked customer |
| 400 | `not_allowed` | Built-in rule modification | Attempting to delete or modify built-in filter pattern |
| 401 | `unauthorized` | Missing/invalid authentication | No session, expired token |
| 401 | `unauthorized` | SSE token invalid/expired/consumed | Token already used or past 30s TTL |
| 404 | `not_found` | Conversation not found | Invalid ID or not owned by requester |
| 404 | `not_found` | Referenced entity not found | Product or order ID doesn't exist |

All errors follow the standard Medusa error format:

```json
{
  "type": "not_allowed",
  "message": "Rate limit exceeded. Please wait before sending more messages."
}
```

---

## Testing

The plugin includes unit tests covering core logic:

### `cursor-encoding.spec.ts`

- Base64url encoding roundtrip
- Conversation cursors (`last_message_at`, `id`)
- Message cursors (`created_at`, `id`)
- Null and numeric value handling
- Malformed input returns null

### `content-filter-eval.spec.ts`

- Exact match: case-insensitive whole-word matching
- Contains: substring matching
- Regex: built-in patterns (email, phone, URL)
- Priority ordering: exact > contains > regex
- Short-circuit on first match
- Edge cases: empty message, whitespace, unicode

### `rate-limit.spec.ts`

- 20 messages per 60 seconds enforced
- 5 conversations per 3600 seconds enforced
- Per-user isolation
- Applies equally to customers and sellers
- Window reset after expiry

### `unread-counter.spec.ts`

- Only recipient counter increments
- Sender counter unchanged on own message
- Reset to 0 on mark read
- Accumulation across multiple messages
- Reconciliation corrects drifted counts

### `chat-block.spec.ts` (unit)

- Block record creation with customer_id, blocked_by, reason
- Idempotent blocking (duplicate returns existing record)
- Unblocking removes block and allows chat again
- Unblocking non-blocked customer succeeds silently
- Re-blocking after unblock creates new record
- Batch checking (`checkBuyersBlocked`) with mixed blocked/unblocked IDs
- Bidirectional enforcement: blocked customer cannot send, vendor cannot send to blocked customer
- Multi-customer isolation: blocking one does not affect others
- Full lifecycle: block → verify → unblock → re-block cycle
- Admin accountability tracking (`blocked_by` field)

### `chat-block-api.spec.ts` (integration)

- Admin block API: creates block record, returns 201 with block data
- Admin unblock API: removes block, returns success
- Idempotent block (returns existing on duplicate)
- Idempotent unblock (succeeds silently for non-blocked customer)
- Store enforcement: blocked customer cannot create conversations
- Store enforcement: blocked customer cannot send messages
- Vendor enforcement: vendor cannot reply to blocked customer
- `is_buyer_blocked` and `block_reason` fields included in admin and vendor GET responses
- Cross-feature interaction: block does not affect unrelated conversations
- Full lifecycle through API: block → enforce → unblock → verify restored access

---

## Configuration Reference

### Redis Keys

| Key Pattern | TTL | Purpose |
|-------------|-----|---------|
| `sse_token:{uuid}` | 30s | One-time SSE auth token |
| `ratelimit:msg:{sender_id}` | 60s | Message rate limit counter |
| `ratelimit:conv:{sender_id}` | 3600s | Conversation creation rate limit counter |
| `notify:{conversation_id}:{recipient_id}` | 900s | Email notification throttle |

### Redis Pub/Sub Channels

| Channel | Publisher | Subscribers |
|---------|-----------|------------|
| `messaging` | `publishMessageEventStep` | SSE route handlers (store, vendor, admin) |
| `filter_rules_changed` | `invalidateFilterCacheStep` | None by default (available for custom cross-instance subscriber) |

### Module Identifiers

| Module | Identifier | Container Key |
|--------|-----------|---------------|
| Messaging | `messaging` | `messagingModuleService` |
| Messaging Filters | `messagingFilters` | `messagingFiltersModuleService` |
| Messaging Redis | `messagingRedis` | `messagingRedisModuleService` |

### Medusa Events Emitted

| Event | Payload | Trigger |
|-------|---------|---------|
| `messaging.message.created` | `{ id, conversation_id, sender_id, sender_type, recipient_id }` | After message creation |

### Notification Templates

| Template ID | Variables | Usage |
|------------|-----------|-------|
| `messaging-new-message` | `sender_name`, `conversation_id` | Email notification to message recipient |

### Database Tables

| Table | Module | Prefix |
|-------|--------|--------|
| `conversation` | messaging | `conv` |
| `message` | messaging | `msg` |
| `chat_block` | messaging | `cblk` |
| `filter_rule` | messagingFilters | `filt` |
| `blocked_message_log` | messagingFilters | `bml` |

### Vendor Dashboard Pages

| Route | Description |
|-------|-------------|
| `/messages` | Conversation list with unread badges |
| `/messages/:id` | Chat detail with reply composer and order sidebar |

### Admin Dashboard Pages

| Route | Description |
|-------|-------------|
| `/messages` | Searchable conversation list with seller/buyer names |
| `/messages/:id` | Read-only message thread with conversation metadata sidebar, block/unblock controls |
| `/messages/filters` | Content filter rule management |
| `/messages/blocked` | Blocked message log viewer |
