# Meilisearch Search Block for Mercur

## What It Does

The Meilisearch Search block adds fast, full-text product search to your Mercur marketplace. Shoppers can find products instantly by typing keywords, filtering by category, price range, or seller — all with results appearing in milliseconds.

This is an **opt-in block**: it only activates when you install it and connect a Meilisearch instance. Your marketplace works normally without it.

## Key Features

### Instant Product Search
Shoppers type a query and see matching products immediately. Results are ranked by relevance — the best matches appear first. Typos are handled gracefully ("runnig shoes" still finds "running shoes").

### Smart Filtering
Shoppers can narrow results by:
- **Category** — browse within a specific product category
- **Price range** — set minimum and/or maximum price
- **Seller** — view products from a specific store

Filters combine naturally: "shoes under $100 from ACME Store" works as expected.

### Seller Moderation Built In
When a marketplace admin suspends a seller, that seller's products are **automatically hidden** from search results. No manual cleanup required. When the seller is reinstated, their products reappear in search automatically.

### Real-Time Product Updates
The search index stays in sync with your product catalog:
- New products appear in search within seconds of being published
- Updated product details (title, price, description) are reflected immediately
- Deleted or unpublished products are removed from search automatically
- Seller status changes (suspension/reinstatement) trigger automatic re-indexing

### Admin Dashboard Tools
Marketplace administrators get two tools:
- **Health check** — see whether the search engine is running and how many products are indexed
- **Manual re-sync** — trigger a full re-index of all products if the index ever gets out of sync

## How Shoppers Experience It

1. A shopper visits your storefront and types a search query
2. Results appear ranked by relevance, showing product title, image, price, and seller
3. The shopper can apply filters to narrow results (category, price, seller)
4. Pagination lets them browse through large result sets
5. Only products from active, approved sellers appear — suspended seller products are never shown

## What You Need

### Meilisearch Instance
Meilisearch is an open-source search engine. You need a running instance accessible from your Mercur server.

**Options:**
- **Meilisearch Cloud** (meilisearch.com) — managed hosting, easiest setup
- **Self-hosted** — run Meilisearch on your own infrastructure (Docker, VPS, etc.)

You will need:
- The Meilisearch **host URL** (e.g., `https://search.yourmarketplace.com`)
- A Meilisearch **API key** (the master key or an admin key)

### Mercur Marketplace
A running Mercur marketplace with products and sellers already configured.

---

## Integration Guide

### Step 1: Install the Block

From your Mercur project root, run:

```bash
npx @mercurjs/cli add meilisearch
```

This copies the block source files into your project:
- `src/modules/meilisearch/` — module service, types, and index configuration
- `src/subscribers/` — event handlers for product/seller sync
- `src/api/store/meilisearch/` — store search endpoint
- `src/api/admin/meilisearch/` — admin status and sync endpoints
- `src/workflows/meilisearch/` — full re-index workflow

The CLI also installs the `meilisearch` npm package as a dependency.

### Step 2: Register the Module

Open your `medusa-config.ts` and add the meilisearch module to the `modules` array. Use a conditional so the module only loads when environment variables are set:

```typescript
modules: [
  // ... existing modules
  ...(process.env.MEILISEARCH_HOST ? [{
    resolve: './modules/meilisearch',
    options: {
      host: process.env.MEILISEARCH_HOST,
      apiKey: process.env.MEILISEARCH_API_KEY,
    },
  }] : []),
]
```

### Step 3: Register Middlewares

Open your `src/api/middlewares.ts` and add the meilisearch store middlewares:

```typescript
import { defineMiddlewares } from "@medusajs/medusa"
import { meilisearchStoreMiddlewares } from './store/meilisearch/products/search/middlewares'

export default defineMiddlewares({
  routes: [
    // ... existing routes
    ...meilisearchStoreMiddlewares,
  ],
})
```

> **Warning:** The CLI may prompt you to replace your existing `middlewares.ts` file during installation. If you already have middleware routes defined, **do not replace it**. Instead, manually merge the meilisearch middlewares into your existing `defineMiddlewares` call as shown above. Replacing the file removes the `defineMiddlewares` default export, which causes `req.validatedBody` to be `undefined` at runtime.

### Step 4: Set Environment Variables

Add these to your `.env` file:

```env
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=your_master_key_here
```

For **local development** with Docker, you can start a Meilisearch instance:

```bash
docker run -d \
  --name meilisearch \
  -p 7700:7700 \
  -e MEILI_MASTER_KEY=your_master_key_here \
  -e MEILI_ENV=development \
  -v meilisearch_data:/meili_data \
  getmeili/meilisearch:v1.12
```

### Step 5: Restart and Sync

1. Restart your Medusa server:
   ```bash
   npm run dev
   ```

2. Trigger an initial sync to populate the search index. Use the admin endpoint:
   ```bash
   curl -X POST http://localhost:9000/admin/meilisearch \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```

   Or use the admin dashboard if available.

After the initial sync, the index stays up to date automatically via event subscribers.

---

## API Reference

### Store Endpoints

#### `POST /store/meilisearch/products/search`

Search products. Requires `x-publishable-api-key` header.

**Request body:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `query` | string | `""` | Search query text |
| `page` | number | `1` | Page number (1-based) |
| `hitsPerPage` | number | `12` | Results per page (1-100) |
| `filters.categories` | string[] | — | Filter by category IDs |
| `filters.price_min` | number | — | Minimum price |
| `filters.price_max` | number | — | Maximum price |
| `filters.seller_handle` | string | — | Filter by seller handle |
| `currency_code` | string | — | 3-letter currency for calculated prices |
| `region_id` | string | — | Region ID for calculated prices |

**Response:**

```json
{
  "products": [
    {
      "id": "prod_123",
      "title": "Running Shoes",
      "handle": "running-shoes",
      "description": "Great shoes",
      "thumbnail": "https://...",
      "status": "published",
      "variants": [...],
      "categories": [...],
      "seller": { "id": "slr_1", "name": "ACME", "handle": "acme", "status": "active" }
    }
  ],
  "totalHits": 42,
  "page": 1,
  "totalPages": 4,
  "hitsPerPage": 12,
  "processingTimeMs": 5,
  "query": "shoes"
}
```

**Important:** The `seller.status = "active"` filter is always enforced server-side (FR-003). Suspended seller products never appear in results regardless of what filters the client sends.

**Pagination:** Meilisearch uses 1-based page numbering. Page 1 is the first page of results.

### Admin Endpoints

Both require admin authentication.

#### `GET /admin/meilisearch`

Returns index health and document count.

```json
{
  "host": "http://localhost:7700",
  "index": "products",
  "documentCount": 42,
  "isHealthy": true
}
```

#### `POST /admin/meilisearch`

Triggers a full re-index of all published products.

```json
{
  "message": "Sync in progress"
}
```

---

## Storefront Integration

Your storefront should call the search endpoint using the Medusa JS SDK:

```typescript
import Medusa from "@medusajs/js-sdk"

const sdk = new Medusa({
  baseUrl: "http://localhost:9000",
  publishableKey: "pk_your_key_here",
})

// Search products
const results = await sdk.client.fetch("/store/meilisearch/products/search", {
  method: "POST",
  body: {
    query: "shoes",
    page: 1,
    hitsPerPage: 12,
    filters: {
      price_max: 100,
    },
  },
})
```

**Do not use raw `fetch()`** — the SDK automatically includes the required `x-publishable-api-key` header.

For autocomplete/typeahead, use a debounced version of the same endpoint with a smaller `hitsPerPage` (e.g., 5).

---

## Security and Privacy

- Search results **never** include products from suspended sellers — this is enforced server-side and cannot be bypassed by the storefront
- Filter values are validated and sanitized — shoppers cannot inject malicious search filters
- The store search endpoint requires a publishable API key
- Admin endpoints require admin authentication
- The Meilisearch API key is stored server-side and never exposed to shoppers

## Frequently Asked Questions

**Does this replace the default Medusa product listing?**
No. The default product listing continues to work. Meilisearch provides an additional, faster search experience. You can use both.

**What happens if Meilisearch goes down?**
Search queries will return errors, but the rest of your marketplace (checkout, orders, admin) continues working normally. The admin health check endpoint lets you monitor availability.

**How many products can it handle?**
Meilisearch is designed for millions of documents. Performance depends on your Meilisearch instance size, but typical marketplaces with thousands of products will see sub-100ms search times.

**Does it support multiple languages?**
Yes. Meilisearch has built-in support for many languages and handles accents, diacritics, and CJK characters.

**What data is sent to Meilisearch?**
Product titles, descriptions, handles, categories, tags, variant details, prices, and seller information (name, handle, status). No customer data or order data is indexed.

**Can I customize which fields are searchable?**
The block configures sensible defaults (title, description, handle, categories, tags, seller name are searchable; price and category ID are filterable). You can adjust the settings in `src/modules/meilisearch/service.ts` in the `ensureSettings()` method.

**Is there a cost?**
Meilisearch itself is open source and free to self-host. Meilisearch Cloud offers managed hosting with paid plans. The Mercur block is free.
