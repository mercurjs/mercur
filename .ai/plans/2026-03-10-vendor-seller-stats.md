# Vendor Seller Stats Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `GET /vendor/sellers/me/stats` endpoint returning product/order counts, and display them on the vendor profile page.

**Architecture:** Two `query.graph()` calls count products and orders linked to the seller via existing link tables (`product_seller`, `order_seller`). Frontend fetches stats via `fetchQuery` and renders a new section on the profile page.

**Tech Stack:** MedusaJS Query Graph, React, @tanstack/react-query, @medusajs/ui

---

## Chunk 1: Backend + Types

### Task 1: Add response type to `@mercurjs/types`

**Files:**
- Modify: `packages/types/src/http/seller.ts`

- [ ] **Step 1: Add `VendorSellerStatsResponse` type**

In `packages/types/src/http/seller.ts`, add at the end:

```typescript
export interface VendorSellerStatsResponse {
  stats: {
    product_count: number
    order_count: number
  }
}
```

- [ ] **Step 2: Verify types compile**

Run: `cd packages/types && bun run build`
Expected: SUCCESS

- [ ] **Step 3: Commit**

```bash
git add packages/types/src/http/seller.ts
git commit -m "feat(types): add VendorSellerStatsResponse type"
```

---

### Task 2: Add route handler

**Files:**
- Create: `packages/core-plugin/src/api/vendor/sellers/me/stats/route.ts`

- [ ] **Step 1: Create route handler**

Create `packages/core-plugin/src/api/vendor/sellers/me/stats/route.ts`:

```typescript
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorSellerStatsResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.auth_context.actor_id

  const [{ data: products }, { data: orders }] = await Promise.all([
    query.graph({
      entity: "product_seller",
      fields: ["product_id"],
      filters: { seller_id: sellerId },
    }),
    query.graph({
      entity: "order_seller",
      fields: ["order_id"],
      filters: { seller_id: sellerId },
    }),
  ])

  res.json({
    stats: {
      product_count: products.length,
      order_count: orders.length,
    },
  })
}
```

- [ ] **Step 2: Verify types compile**

Run: `cd packages/core-plugin && bun run build`
Expected: SUCCESS

- [ ] **Step 3: Commit**

```bash
git add packages/core-plugin/src/api/vendor/sellers/me/stats/route.ts
git commit -m "feat(core-plugin): add GET /vendor/sellers/me/stats route"
```

---

### Task 3: Register middleware

**Files:**
- Modify: `packages/core-plugin/src/api/vendor/sellers/middlewares.ts`

- [ ] **Step 1: Add middleware entry for stats route**

In `packages/core-plugin/src/api/vendor/sellers/middlewares.ts`, add a new entry to the `vendorSellersMiddlewares` array (after the last existing entry, before the closing `]`):

```typescript
  {
    method: ["GET"],
    matcher: "/vendor/sellers/me/stats",
    middlewares: [],
  },
```

Note: No query/body validation needed — endpoint takes no parameters. Auth is handled globally for all `/vendor/*` routes.

- [ ] **Step 2: Verify build**

Run: `cd packages/core-plugin && bun run build`
Expected: SUCCESS

- [ ] **Step 3: Commit**

```bash
git add packages/core-plugin/src/api/vendor/sellers/middlewares.ts
git commit -m "feat(core-plugin): register middleware for seller stats route"
```

---

## Chunk 2: Frontend

### Task 4: Add seller stats hook

**Files:**
- Modify: `packages/vendor/src/hooks/api/users.tsx`

- [ ] **Step 1: Add `useSellerStats` hook**

In `packages/vendor/src/hooks/api/users.tsx`, add at the end of the file:

```typescript
export const useSellerStats = (
  options?: UseQueryOptions<any, Error, { stats: { product_count: number; order_count: number } }>
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => fetchQuery("/vendor/sellers/me/stats", { method: "GET" }),
    queryKey: [...usersQueryKeys.me(), "stats"],
    ...options,
  });

  return {
    ...data,
    ...rest,
  };
};
```

This uses `fetchQuery` (not `sdk`) since the stats endpoint isn't part of the generated Routes client.

- [ ] **Step 2: Verify types compile**

Run: `cd packages/vendor && bun run check-types`
Expected: SUCCESS (or only pre-existing errors)

- [ ] **Step 3: Commit**

```bash
git add packages/vendor/src/hooks/api/users.tsx
git commit -m "feat(vendor): add useSellerStats hook"
```

---

### Task 5: Add i18n keys

**Files:**
- Modify: `packages/vendor/src/i18n/translations/en.json`

- [ ] **Step 1: Add translation keys**

In `packages/vendor/src/i18n/translations/en.json`, add inside the root object:

```json
"seller": {
  "stats": {
    "label": "Statistics",
    "productCount": "Products",
    "orderCount": "Orders"
  }
}
```

If a `"seller"` key already exists, merge into it.

- [ ] **Step 2: Commit**

```bash
git add packages/vendor/src/i18n/translations/en.json
git commit -m "feat(vendor): add seller stats i18n keys"
```

---

### Task 6: Create stats section component

**Files:**
- Create: `packages/vendor/src/pages/settings/seller/_components/seller-stats-section.tsx`

- [ ] **Step 1: Create component**

Create `packages/vendor/src/pages/settings/seller/_components/seller-stats-section.tsx`:

```typescript
import { Container, Heading, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { useSellerStats } from "@/hooks/api";

export const SellerStatsSection = () => {
  const { t } = useTranslation();
  const { stats, isPending } = useSellerStats();

  if (isPending || !stats) {
    return null;
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">{t("seller.stats.label", "Statistics")}</Heading>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("seller.stats.productCount", "Products")}
        </Text>
        <Text size="small" leading="compact">
          {stats.product_count}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("seller.stats.orderCount", "Orders")}
        </Text>
        <Text size="small" leading="compact">
          {stats.order_count}
        </Text>
      </div>
    </Container>
  );
};
```

- [ ] **Step 2: Verify types compile**

Run: `cd packages/vendor && bun run check-types`
Expected: SUCCESS (or only pre-existing errors)

- [ ] **Step 3: Commit**

```bash
git add packages/vendor/src/pages/settings/seller/_components/seller-stats-section.tsx
git commit -m "feat(vendor): add SellerStatsSection component"
```

---

### Task 7: Add stats section to seller profile page

**Files:**
- Modify: `packages/vendor/src/pages/settings/seller/seller-detail-page.tsx`

- [ ] **Step 1: Import and add SellerStatsSection**

In `packages/vendor/src/pages/settings/seller/seller-detail-page.tsx`:

1. Add import:
```typescript
import { SellerStatsSection } from "./_components/seller-stats-section";
```

2. In the `Root` component's default render (inside the fragment where `<SellerGeneralSection>` is), add `<SellerStatsSection />` after `<SellerGeneralSection>`:

```tsx
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <SellerGeneralSection seller={seller} />
          <SellerStatsSection />
        </>
      )}
```

3. Add to compound component exports:
```typescript
export const SellerDetailPage = Object.assign(Root, {
  GeneralSection: SellerGeneralSection,
  StatsSection: SellerStatsSection,
  Header: SellerDetailHeader,
  HeaderTitle: SellerDetailTitle,
  HeaderActions: SellerDetailActions,
  HeaderEditButton: SellerDetailEditButton,
});
```

- [ ] **Step 2: Verify types compile**

Run: `cd packages/vendor && bun run check-types`
Expected: SUCCESS (or only pre-existing errors)

- [ ] **Step 3: Commit**

```bash
git add packages/vendor/src/pages/settings/seller/seller-detail-page.tsx
git commit -m "feat(vendor): display seller stats on profile page"
```

---

## Verification

- [ ] Run `bun run check-types` from repo root
- [ ] Run `cd packages/core-plugin && bun run build`
- [ ] Run `cd packages/vendor && bun run build`
- [ ] Manual test: login as vendor, navigate to seller profile, verify stats display
