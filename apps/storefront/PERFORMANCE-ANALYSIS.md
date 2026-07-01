# Storefront Performance Analysis & Optimization Strategy

> Comparison of `apps/storefront` (Next.js 15 App Router) — with a prioritized
> plan to close the performance gap.

## Framing: this is not an apples-to-apples framework comparison

Both reference storefronts are **Astro (5 / 7) on Cloudflare Workers**, while this app is
**Next.js 15 App Router**. Their speed does **not** come from Astro — it comes from an
_architecture_ that Next.js can fully replicate:

- Server-rendered HTML held in an **edge cache** and served before any page code runs.
- The cached HTML shell contains **no per-user data**; personalization (cart) is a
  **deferred "server island"** streamed in separately.
- A **separate data-layer cache** with a ~1-year TTL, invalidated by **tag purge**, not by
  short TTLs.
- **Minimal client JS** (sparse hydration — islands only for real interactivity).
- Preloaded LCP images + self-hosted fonts, parallelized fetches, link prefetch + view
  transitions.

Every one of these has a Next.js equivalent. This app is currently missing most of them.

---

## The one root cause of the slowness

**The entire app renders dynamically on every request. There is zero static/ISR output.**

The killer is `app/layout.tsx` — it calls `await retrieveCart()`, which reads `cookies()`,
which opts **every route in the tree** out of static generation. Combined with:

- **no `generateStaticParams` anywhere** (no product/category/collection/seller page is
  prebuilt), and
- pervasive `cookies()` / `headers()` in the data layer (`lib/data/cookies.ts`, home &
  category pages),

…even the two `revalidate = 60` category routes
(`app/[locale]/(main)/categories/page.tsx`, `categories/[category]/page.tsx`) end up
rendering fresh per request. The ISR window is effectively moot.

Both fast apps solve exactly this: the cached HTML shell carries no per-user data, and the
cart is a `server:defer` island (fallback + streamed separately). **That is the pattern to
port.**

---

## How the fast apps map onto Next.js

| Fast-app technique                     | Your Next.js equivalent                                                                                                                             |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Edge-cached full HTML before code runs | Static/ISR pages + PPR (Partial Prerendering) / **Cache Components**                                                                                |
| Cart as `server:defer` island          | Pull `retrieveCart()` **out of the root layout**; render cart in a `<Suspense>` boundary (dynamic hole) or a client component that fetches on mount |
| Data cache w/ ~1yr TTL + tag purge     | `"use cache"` / `unstable_cache` + `revalidateTag` (tag revalidation already exists — extend it)                                                    |
| `generateStaticParams`                 | Add to product / category / collection / seller pages                                                                                               |
| Build-versioned cache keys             | Next handles this automatically via build ID                                                                                                        |
| Sparse hydration (islands)             | Reduce `"use client"` footprint; lazy-load heavy SDKs                                                                                               |

---

## Prioritized changes

### 1. De-dynamic the shell (biggest win)

Remove `await retrieveCart()` from `app/layout.tsx`. Move cart state into the existing
`CartProvider` (client) fetching via an endpoint/action, or wrap it in `<Suspense>` so the
static shell ships instantly and the cart streams in. This alone converts the app from
"SSR everything" to "static shell + dynamic hole."

### 2. Adopt Cache Components / PPR

Skills are already installed for this: **`next-cache-components-adoption`** (flip the flag,
resolve blocking routes) and **`next-cache-components-optimizer`**. This is the closest
Next.js analog to the reference apps' edge-cached-HTML-with-dynamic-holes model. Turn on
`cacheComponents`, mark static content with `"use cache"`, and let cart/auth be the dynamic
holes.

### 3. Add `generateStaticParams`

Add to `products/[handle]`, `categories/[category]`, `collections/[handle]`, and seller
pages. Prebuild the top N by traffic, ISR the rest. Nothing is prebuilt today.

### 4. Add `loading.tsx`

There are **zero** `loading.tsx` files, so navigations have no instant skeleton. Add them
at route-group and dynamic-segment levels. The reference apps skip these only because a
cache HIT means there's nothing to wait for — this app doesn't have that yet.

### 5. `optimizePackageImports` in `next.config.ts`

```ts
experimental: {
  optimizePackageImports: ['lodash', '@medusajs/ui', '@medusajs/icons', 'date-fns'],
}
```

Also switch `import { isEmpty } from 'lodash'` → `import isEmpty from 'lodash/isEmpty'`
(~8 files). Full-lodash named imports currently risk pulling in the whole library.

### 6. Fix the fetch caching mismatch

Category/collection **listings** run `cache: 'no-cache'` (`lib/data/products.ts:88`) — the
highest-traffic pages have the least caching. The reference apps cache these aggressively
and purge by tag. Give product/category reads a `revalidate` + tag, and invalidate on the
relevant mutations.

### 7. Parallelize data fetches

Reference apps use `Promise.all` / `better-all` in ~21 places. Audit pages for sequential
`await`s that could run concurrently via `Promise.all`.

### 8. Link prefetching + view transitions

For the SPA feel both fast apps get (`prefetchAll` + `<ClientRouter />`). Next `<Link>`
prefetches on viewport by default — confirm it isn't disabled; consider
`experimental.viewTransition`.

---

## Quick cleanups (low effort, real value)

- **Delete the `next/head` block in `app/layout.tsx`** — no-op in App Router; its Google
  Fonts preconnects are dead since fonts are self-hosted via `next/font`.
- **Remove 5 unused i18n deps** — `next-intl`, `i18next`, `react-i18next`,
  `i18next-browser-languagedetector`, `react-country-flag` (never imported).
- **Tighten the image `hostname: '**'`wildcard** to the actual S3/Mercur hosts (currently
lets the optimizer proxy any HTTPS image); add`formats`/`minimumCacheTTL`.
- **Reconsider `typescript.ignoreBuildErrors: true`** — currently shipping with suppressed
  type errors.
- **Lazy-load TalkJS and Stripe** (`next/dynamic`, load on interaction/route). Both are
  heavy client SDKs; TalkJS spans 8 components.
- Middleware does a backend `/store/regions` fetch on cold requests — acceptable, but its
  in-memory cache is per-instance.

---

## What's already good (keep it)

- `next/image` everywhere (no raw `<img>`).
- Correct LCP `priority` / `sizes` + hero preload.
- Self-hosted `next/font` (Funnel Display).
- Thin root client boundary (`providers.tsx` wraps only `CartProvider`).
- Solid tag-based mutation invalidation in `cart.ts` / `customer.ts` / `wishlist.ts` /
  `reviews.ts`.

The foundation is fine. The problem is almost entirely that **nothing gets cached or
prerendered because the shell reads cookies.**

---

## Suggested execution order

1. Pull the cart out of the root layout → shell can go static (unblocks 2–4).
2. Turn on Cache Components / PPR via the installed skills.
3. Add `generateStaticParams` + `loading.tsx`.
4. `optimizePackageImports` + lodash deep imports.
5. Fix listing-page fetch caching + tag invalidation.
6. Parallelize fetches; lazy-load TalkJS/Stripe; config + dependency cleanups.
