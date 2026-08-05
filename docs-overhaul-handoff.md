# Mercur Docs Overhaul — Session Handoff

Big context for continuing this work (and running parallel tracks). Everything
described as **DONE** is committed on branch `docs/platform-build-reference-overhaul`
and open as **PR #1340** to `main` (https://github.com/mercurjs/mercur/pull/1340).

All work is in **`apps/docs/`** (Mintlify). Nothing outside `apps/docs` was touched.

---

## 1. How to run the docs locally

```bash
cd apps/docs
npx -y mint@latest dev --port 3333
```

- Use the **new `mint` CLI**, NOT the globally installed `mintlify` (that one is old and needs `mint.json`; this repo uses the new `docs.json` schema and it will error).
- Preview at `http://localhost:3333`. Hot-reload is on for `docs.json` and `.mdx`.
- Theme config, palette, and fonts live in `docs.json`; custom CSS in `apps/docs/style.css`.

---

## 2. Final navigation (tabs in `docs.json`)

- **Learn** — Get started (introduction, installation, concepts, architecture, mirakl-alternative, first-marketplace) · Marketplace concepts (learn/sellers, offers, …) · Blocks
- **Platform** — one section per module: **Store · Catalog · Offer · Attribute · Product Edit · Order Group · Commission · Payout · Review**. Each is an icon'd group: `overview` (flat) + collapsible **Concepts / Guides / Reference** nested groups.
- **Build** (was "Resources") — **AI tools** (🤖) · **How-Tos** (🔧: Server/Panels/Blocks) · **Integrations** (🔌) · **Deployment** (🚀)
- **Reference** (was "References") — Overview · **Panel extensions** (Overview, Custom Fields, Widgets, Create new page) · Admin API · Vendor API · Store API · Configuration
- **User Guide** — Admin Panel · Vendor Panel (only 4 thin pages, mostly untouched)
- **Migration** · **Changelog** (empty)

---

## 3. Established conventions — FOLLOW THESE for consistency

### Voice / writing (applied across Platform + Build)
- **No em-dashes (`—`).** Replace with a period + new sentence (default), a colon before a definition/list, `such as A, B, or C`, or a comma. Verify with `grep -rn "—" <dir>`.
- Short declarative sentences, one idea each. Active voice. Second person for guidance; imperative for tasks ("Run…", "Add…").
- Capability/feature bullets: `**Label:** description.` (colon, not dash).
- Concept openers define cleanly, then name the data model in a second sentence. Example: *"A member is a dashboard user who can manage one or more stores. It is represented by the `Member` data model (table `member`, id prefix `mem`)."*
- Sentence-case subheadings. Use `<Steps>` for sequential flows.
- Reference: Browserbase (docs.browserbase.com) + Supabase (supabase.com/docs) cadence. **Do not name them in commits/PRs.**

### Platform module template (mirror the Store module — it is the canonical reference)
Files live under `apps/docs/platform/<slug>/`:
- `overview.mdx` — Supabase-Storage shape: 1-sentence lead → intro → `## Key features` → `## Get started` (cards → concepts) → `## Examples` (cards → guides) → `## Resources` (cards → reference). All CardGroups `cols={2}`.
- `concepts/*.mdx` — Medusa concepts style: each `##` names its data model, prose + a `ts` snippet where useful + `<Note>/<Tip>`.
- `guides/*.mdx` — **SERVER guides** (developer/code, NOT panel click-throughs): "In this guide, you'll learn how to…", import workflows from `@mercurjs/core/workflows`, run against `req.scope`/container.
- `reference/{data-models,links,workflows,service,events}.mdx` — co-located. **No API-endpoint content here** (that lives only in the Reference tab).

Nav per module = a top-level group with `icon`, containing `overview` + three nested groups (Concepts/Guides/Reference). Nesting matters: top-level groups render as fixed headers, **nested** groups get the collapsible `›` chevron.

### Styling (already set)
- `docs.json`: `theme: "maple"`, `appearance.default: "dark"`, `fonts.family: "Inter"`, `colors` `{primary #7C3AED, light #8B5CF6, dark #6D28D9}`, `background` `{light #FFFFFF, dark #0C0A12}`.
- `style.css`: dark surfaces (sidebar `#15121D`, search `#1B1726`, code blocks), tight heading letter-spacing, and **square corners** (`border-radius: 0` on rounded-* utilities, `rounded-full` preserved).

### Editing `docs.json` safely
Use Python with `collections.OrderedDict` to preserve key order:
```python
import json, collections
d=json.load(open('docs.json'), object_pairs_hook=collections.OrderedDict)
# ...mutate...
json.dump(d, open('docs.json','w'), indent=2, ensure_ascii=False); open('docs.json','a').write('\n')
```
Validate before committing: parse `docs.json`, confirm every string under a `pages` array resolves to `<path>.mdx`, and `grep` for links to removed paths.

---

## 4. Codebase facts baked into the docs (verified from `packages/core`)

- **Module service resolve:** `container.resolve(MercurModules.X)` from `@mercurjs/types` (enum in `packages/types/src/modules.ts`). NOT a per-module `X_MODULE` constant.
- **Workflows** import from `@mercurjs/core/workflows`; run as `createXWorkflow(scope).run({ input })`.
- **Catalog** = Medusa's Product module (`Modules.PRODUCT` from `@medusajs/framework/utils`), not a Mercur module. Products are the **shared master catalog**; sellers sell via **offers** (never say a seller owns products). `product_seller` link = the allowlist.
- **Order Group**: `OrderGroup` model lives in the **seller module** → resolve `MercurModules.SELLER`. No `ORDER_GROUP` key. id prefix `og`, computed `seller_count`/`total`.
- **Product Edit**: id prefixes `prodch`/`prodchact`. `requires_action` is a `CHANGE_REQUESTED` **action**, not a status. Auto-confirm is gated by the `PRODUCT_REQUEST` feature flag.
- **Commission**: defines **no** `defineLink` links and emits **no** own events (an `order-commission-refresh-handler` subscriber reacts to order events).
- **Payout**: the automated **scheduled jobs** (capture-check, daily payout, `payout.requested`/`order.capture_requested` events) are **NOT shipped in core** (no `packages/core/src/jobs`; `PayoutEvents` has a `TODO`). Only the workflows + webhook subscriber ship. Docs frame the jobs as project-wired (`platform/payout/concepts/payout-pipeline.mdx` has a `<Note>` saying so). Do not claim it runs out of the box.
- **Offer**: inventory links to the **offer, not the variant**; offer-scoped pricing via an `offer_id` PriceRule on the shared variant price set.
- **Attribute**: id prefixes `pattr`/`pattrval`; 5 `AttributeType` values; mirror links to `ProductOption`/`ProductOptionValue`.
- **Review**: single `Review` model (id `rev`), `reference` enum `product|seller`, 4 workflows, 4 links, aggregate helpers (`getAvgRating`, `getProductsWithRating`, `getSellersWithRating`), **no events**.
- **Search module** was **removed from core** by the user; all search docs deleted this session.
- **Global product options** are stable in **Medusa 2.17.2** (the old "2.16 preview / RC" note was removed).
- `/rc/...` links are legacy redirect sources; the canonical path is root (`/…`). New content uses root paths. Many old pages still use `/rc/` (redirects handle them).

---

## 5. What was DONE this session (all in PR #1340)

1. **Platform tab built** — 9 module sections, ~110 pages, on the Store template, facts from `packages/core`.
2. **Build tab** — renamed from Resources; AI tools (Overview + new **Skills** page covering official Medusa agent skills + MCP; removed standalone LLMs page); **How-Tos** (rebranded from Best practices; Server/Panels/Blocks with Medusa-style task titles, e.g. "How to Create a Custom Module" / sidebar "Create a Module"); removed Tutorials + Customization groups; Integrations (Overview + Stripe Connect; deleted Search + Notifications); Deployment (renamed Medusa Cloud, added **Self-host** guide). Section icons added.
3. **Reference tab** — renamed to "Reference"; **Panel extensions** group (split the old `panel-extension-api.mdx` into Overview/Custom Fields/Widgets/Create new page); **removed Modules + Workflows** groups (now co-located in Platform); rewrote `references/overview.mdx`.
4. **Removals** — entire `v1/` docs, the **Tools** tab (CLI/API client/Dashboard SDK pages), the **Search** module + `/store/search` endpoint, the legacy version switcher (2.2.0/1.x), 5 operator tutorial pages (configure-commissions, seller-payouts-stripe, handle-product-requests, import-export-products, store-setup-checklist).
5. **Styling** — maple theme, dark palette, Inter, square corners, `style.css` surfaces. Removed the old blurred-glow background.
6. **Voice pass** — Platform + Build are fully em-dash-free and in the tighter voice.
7. All inbound links to removed pages were repointed; `docs.json` validated (every nav page exists, no broken links to deleted areas).

Memories written (`~/.claude/projects/-Users-viktorholik-Desktop-mercur/memory/`): `docs-platform-tab-structure`, `docs-module-service-resolve-key`, `payout-scheduled-jobs-not-shipped`.

---

## 6. WHAT'S LEFT — independent tracks for parallel work

Each track below is largely independent (different files/tabs) and safe to run in parallel. Use the conventions in §3.

### Track A — Learn tab de-duplication (HIGH priority)
The Learn tab's **"Marketplace concepts"** group (`learn/sellers`, `learn/seller-members`, `learn/products`, `learn/offers`, `learn/attributes`, `learn/product-requests`, `learn/order-groups`, `learn/commissions`, `learn/payouts`) now **duplicates the Platform tab**. Decide: delete these and repoint their many inbound links to `/platform/<module>/...`, or keep Learn as a light conceptual intro and trim. `learn/introduction`, `learn/concepts`, `learn/architecture` also overlap. Note: lots of `/rc/learn/...` links across the docs point here.

### Track B — User Guide tab (HIGH priority)
Only 4 thin pages exist (`user-guide/{admin,vendor}/{overview,stores}`). This is the no-code operator/vendor audience. The 5 deleted operator tutorials should be **rewritten here** as User Guide pages (configure commissions, set up Stripe payouts, handle product requests/edits, import/export products, store setup checklist). Structure it like Shopify's merchant Help Center (separate from dev docs).

### Track C — Enterprise positioning (from the original brief; NOT done)
The founding brief wanted dedicated crawlable pages that never got created:
- `learn/enterprise.mdx` (SSO/SAML, RBAC, audit log, DAC7/Omnibus, air-gap, Buy Box, EAN dedup, KYC, split payouts) — claims must be truthful ("supports / designed for" vs "on the roadmap").
- `learn/security-compliance.mdx` (data ownership, self-host/on-prem/air-gap, RBAC, audit trail, DAC7/Omnibus, GDPR).
- Consider an **Enterprise** tab and move `learn/mirakl-alternative` into it.
- `docs.json` top-level `description` still says **"marketplace framework"** (and has an em-dash) — the brief wanted **"enterprise marketplace platform built on Medusa."** `learn/introduction.mdx` says "marketplace platform" (good) but still has an em-dash on line 6 and could lead more enterprise-first.

### Track D — Reference tab voice pass
`references/configuration.mdx`, `references/api/conventions.mdx`, and the API overview pages still contain em-dashes and predate the tighter voice. Run the same prose pass (§3) over the Reference tab. (Platform reference pages are already clean.)

### Track E — Stubs & housekeeping
- `resources/tutorials/first-marketplace.mdx` is a **stub** ("This tutorial is being written") — write it (create project → approve seller → list product → split order → payout).
- **Changelog** tab is empty — populate or remove.
- Deleted **API Client / CLI / Dashboard SDK** content (old Tools tab) — decide whether to relocate the typed-client + CLI reference into the Reference tab (it was the recommended way to call the APIs; its inbound links are now plain text).
- **MCP tool name** `SearchMercurJsDocumentation` is auto-generated by Mintlify from the site `name` ("MercurJS Documentation"); not independently renamable without a custom self-hosted MCP. Left as-is.

---

## 7. Gotchas / CI notes
- `bun run lint` is red on canary from pre-existing unrelated errors — check only your own files.
- CI build gate can fail on core-touching PRs (execa codegen crash) — irrelevant for a docs-only PR like #1340.
- This is a `.claude/worktrees` worktree; integration tests don't run here. Docs changes are verified via the live `mint dev` preview.
- Branch/commit/PR policy (repo CLAUDE.md): **never** name branches `claude/...`; **never** add AI attribution (no `Co-Authored-By: Claude`, no "Generated with", no 🤖) to commits or PRs.
