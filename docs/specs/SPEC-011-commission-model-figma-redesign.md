---
status: in_progress
canonical: false
priority: 2
area: core/commission
created: 2026-06-15
last_updated: 2026-06-15
---

# SPEC-011 Commission Module — Backend for the Figma Redesign

This spec defines the **backend** (`@mercurjs/core` commission module +
admin API) changes required to support the new **Commissions** admin
design:

> **Mercur 2.0 — Admin Panel · Settings → Commissions**
> `figma.com/design/szW2v1o0l3TRUKnraXqsUL`, page node `40016328:49055`.

It is the **backend half** of the redesign. The **admin UI half** is
[SPEC-012](SPEC-012-admin-commissions-figma-ui.md) and depends on the
contract defined here. Splitting them keeps the domain-model /
matching-semantics work (this spec) independent of the page/route/i18n
work (SPEC-012) — the backend can land, be integration-tested, and ship
before any UI is rebuilt.

**Scope: backend only.** Models, migration, the `getCommissionLines`
matching service, validators, query config, workflows, docs, and
integration tests. No `packages/admin` page work — that is SPEC-012.

It is **descriptive**: the Figma design is the source of truth for the
*intent*; the code paths cited are what exists today.

## What exists today

Commission module — `packages/core/src/modules/commission/`:

- **Models** (`models/`): `CommissionRate`, `CommissionRule`,
  `CommissionLine`.
- **`CommissionRate`** fields (`models/commission-rate.ts`,
  migration `Migration20260130132817.ts`): `name`, `code` (unique),
  `type` (`fixed` | `percentage`), `target` (`item` | `shipping`,
  default `item`), `value` (single bigNumber), `currency_code` (single,
  nullable), `min_amount` (nullable), `include_tax` (bool, default
  `false`), `is_enabled` (bool, default `true`), `priority` (int,
  default `0`), `rules[]`.
- **`CommissionRule`**: `{ reference, reference_id, commission_rate_id }`.
  `reference` values handled by the matching service: `product`,
  `product_type`, `product_collection`, `product_category`, `seller`
  (item target), `shipping_option_type` (shipping target).
- **Matching** (`service.ts` `getCommissionLines`,
  `packages/core/src/modules/commission/service.ts:40-220`):
  - Rates split into two pools by `target` (`item` vs `shipping`).
  - Item items matched against `itemRates` in **priority DESC** order;
    a rate with no rules is the **default** (`service.ts:74`); a rate
    with rules matches when **`rules.some(...)`** is true — **OR across
    all rules** (`service.ts:80`).
  - Base = `item.subtotal` (+ `item.tax_total` when `include_tax`).
  - Percentage → `base × value / 100`; Fixed → `value`. `min_amount`
    floor applied. First match wins (`break`).
  - Shipping methods matched against `shippingRates` the same way
    (`service.ts:138-200`), only `shipping_option_type` rules.
- **API** — `packages/core/src/api/admin/commission-rates/`:
  `GET/POST /admin/commission-rates`, `GET/POST/DELETE
  /admin/commission-rates/:id`, `POST /admin/commission-rates/:id/rules`
  (batch create/update/delete rules). Validators in `validators.ts`,
  field selection in `query-config.ts`.
- **Workflows** — `packages/core/src/workflows/commission/`:
  `createCommissionRatesWorkflow`, `updateCommissionRatesWorkflow`,
  `deleteCommissionRatesWorkflow`, `batchCommissionRulesWorkflow`,
  `refreshOrderCommissionLinesWorkflow`.
- **Docs** — `apps/docs/core-concepts/commission.mdx`.

## Domain-model gaps — the headline decisions

> Three things the design implies have no backend today. Each is
> resolved below; implementation follows these resolutions. The UI
> (SPEC-012) consumes the resulting contract.

### Gap 1 — "Shipping included" base option (NOT the current `target`)

**Design.** Both the Global Commission and each rule carry two
independent base toggles:

- **Tax included** — "If checked, commission is calculated based on the
  total amount including tax. If unchecked, tax is excluded and goes
  entirely to the store."
- **Shipping included** — "If checked, commission is calculated based on
  the total amount including shipping. If unchecked, shipping fees go
  entirely to the store."

**Today.** `include_tax` already matches *Tax included*. There is **no**
shipping-included concept; instead the `target` enum splits rates into
disjoint item/shipping pools (a different model).

**Decision.** Add **`include_shipping: boolean`** (default `false`) on
`CommissionRate`, mirroring `include_tax`. Commission is emitted as **two
kinds of lines** — item-anchored and shipping-anchored — never folded
together:

- **Item line** (per line item, keyed on `commission_line.item_id`):
  ```
  base = item.subtotal + (include_tax ? item.tax_total : 0)
  ```
- **Shipping line** (per shipping method, keyed on a **new**
  `commission_line.shipping_method_id`) — emitted **only when the
  governing rate's `include_shipping = true`**:
  ```
  base = shipping_method.subtotal + (include_tax ? shipping_method.tax_total : 0)
  ```

So shipping is **not** proportionally folded into item bases; it gets its
own commission line linked to the shipping method (see §"Removed fields"
for what's dropped, and §"Commission-line linking" for the model/link
change). The **governing rate** for a shipping line is the **default/global
rate**, resolved **independently of the items** the method ships — mirroring
how **Medusa resolves shipping tax** (a shipping method's tax rate is
matched by `reference = "shipping_option"` **OR** `is_default`, scoped to
the tax region only, never inherited from the line items —
`tax-module-service.ts::getTaxRateQueryForItem`). Since we dropped the
shipping-specific commission rule (§"Removed fields"), only the default
branch remains, so the shipping line uses the **global rate's**
`include_shipping` + type/value.

This still **drops `target`** (the per-rate item/shipping pool) and the
`shipping_option_type` rule reference (§"Removed fields"): rates are no
longer split into pools; every rate is item-matched, and `include_shipping`
additionally produces a shipping line. The item-vs-shipping distinction now
lives on the **commission line**, not the rate.

### Gap 2 — per-currency **Fixed** values

**Design.** When **Type = Fixed**, Value is a **multi-currency input** —
one amount per store currency (EUR / USD / GBP in the mock). Percentage
stays a single `%` value.

**Today.** `value` is a single bigNumber, `currency_code` a single
nullable column — one amount, one currency.

**Decision — a `CommissionRateValue` child table (Price-shaped, in-module).**
Add `CommissionRate.values = model.hasMany(() => CommissionRateValue)`,
where each row is `{ currency_code, amount: model.bigNumber(), commission_rate }`.
Keep the scalar `value` for **Percentage**; **Fixed** reads its amount
from `values`. Resolution stays a one-liner in `getCommissionLines`:
`rate.values.find(v => v.currency_code === order.currency_code)?.amount`.

```ts
// models/commission-rate-value.ts
const CommissionRateValue = model.define("CommissionRateValue", {
  id: model.id({ prefix: "comval" }).primaryKey(),
  currency_code: model.text(),
  amount: model.bigNumber(),                 // BigNumber + raw_amount jsonb, like Price.amount / CommissionRate.value
  commission_rate: model.belongsTo(() => CommissionRate, { mappedBy: "values" }),
}).indexes([{ on: ["currency_code"], where: "deleted_at IS NULL" }])
```

**Why not Medusa's PriceSet?** Medusa's canonical money-per-currency
mechanism is the Pricing module (`PriceSet` → `Price`-per-`currency_code`,
written via `createPriceSetsStep` / `updatePriceSetsStep`, resolved via
`pricingModule.calculatePrices(...)`, bridged by a remote link such as
`product_variant_price_set`). A fixed commission needs **none** of what
PriceSet adds — no quantity tiers, no region/customer-group rules, no
price-list SALE/OVERRIDE overlays, no `calculatePrices` resolution. Using
it would (a) couple the commission module to the pricing module via a
remote link, (b) force `getCommissionLines` — today a pure in-memory calc
over query-graph data — to call the pricing service or traverse
`commission_rate.price_set.prices`, and (c) re-introduce exactly the
weight **SPEC-007** deliberately removed ("shared-priceset pricing
simplification"). The `CommissionRateValue` child is the `Price` *shape*
(BigNumber `amount` + `raw_amount` jsonb, currency-indexed) **without** the
`PriceSet`/`PriceRule`/`PriceList`/`calculatePrices` machinery — idiomatic
storage, trivial resolution, zero cross-module coupling.

**Fallbacks (not chosen):** a `fixed_values: Record<currency_code,
number>` JSON map (simplest, but loses BigNumber `raw_amount` precision
and SQL-queryability); a full **commission PriceSet** (only if region- or
tier-scoped commissions ever become real — then PriceSet's idiom and
future-proofing justify its weight).

The **contract**: *Fixed supports an amount per store currency*, and the
matching service selects the amount for the order's `currency_code`.

### Gap 3 — rule matching: AND-across-dimension, OR-within-dimension

**Design.** A rule's **Type** is a scope combination — **Store**
(`seller`), **Product Type** (`product_type`), **Category**
(`product_category`), **Store + Product Type**, **Store + Category**.
Semantics implied: a rule matches when **every chosen dimension** matches
(AND across dimensions) and **any** value within a dimension matches (OR
within a dimension). E.g. *Store + Product Type* with stores {ACME},
types {Outlet} matches items **both** sold by ACME **and** of type
Outlet.

**Today.** A rate's `rules[]` are evaluated with `Array.some(...)` —
**OR across all rules** (`service.ts:80`, `:154`). No dimension grouping.

**Decision.** Change item matching to **AND-across-dimension,
OR-within-dimension**: group a rate's `rules[]` by `reference`; the rate
matches an item only when **every present dimension group** has at least
one matching rule. The rule "Type" is **derived** (not a stored column)
from the set of `reference`s present. This is a behavioral change to
`getCommissionLines` and must be integration-tested.

**Tie-break (no `priority`).** With `priority` removed (see §"Removed
fields") the matching order is **deterministic by specificity**: the rate
matching on **more dimension groups** wins; ties break on **`created_at`
ASC** (oldest wins). The rule-less **default** rate is the lowest
specificity and applies only when no scoped rate matches.

### Removed fields

Per "drop what the design doesn't use", the following columns are
**removed** from `CommissionRate` (migration drops them):

- **`min_amount`** — the design has no minimum-commission floor. (The
  transcript's bike example is a *maximum* cap, not a minimum — a future
  `max_amount` would be a **new** field, out of scope here.) **Drop.**
- **`priority`** — the design exposes no priority control; matching order
  is deterministic by specificity (above). **Drop.**
- **`target`** (`item` | `shipping`) — the per-rate item/shipping pool is
  removed: every rate is item-matched, and shipping commission is driven by
  `include_shipping` (Gap 1), not by a shipping-target rate. Dropping it
  also removes the **`shipping_option_type`** rule reference. **Drop.** (The
  item-vs-shipping distinction now lives on the **commission line** — see
  §"Commission-line linking" — not the rate.)

**Kept:** **`code`** stays and is a **user-editable** field. It is
entered on create (and editable thereafter), stays unique, and feeds the
`CommissionLine.code` snapshot. The create wizard and the Global
Commission both expose a **Code** field (see SPEC-012). Validators
require `code` on create (no auto-generation).

### Commission-line linking (item + shipping)

`getCommissionLines` already emits **both** item lines (keyed on
`item.id`, `service.ts:129`) and shipping lines — but today shipping lines
overload `item_id` with the **shipping-method id** (`service.ts:195`), and
the only link (`links/line-item-commission-line-link.ts`,
`orderLineItem.id → commission_line.item_id`) leaves those shipping lines
**orphaned** (not navigable from anything).

**Decision — give shipping lines their own column + link.**

1. **Model** (`models/commission-line.ts`) — add a **new nullable
   `shipping_method_id: model.text().nullable()`** and make **`item_id`
   nullable**. Each line sets **exactly one** of `item_id` /
   `shipping_method_id` (item line vs shipping line). Add a DB CHECK so
   exactly one is non-null. Migration alters `item_id` to nullable and
   adds `shipping_method_id`.
2. **Keep** `line-item-commission-line-link.ts`
   (`orderLineItem.id → commission_line.item_id`, alias `commission_lines`)
   unchanged — it now only picks up **item** lines (shipping lines have
   `item_id = null`).
3. **Add** `links/shipping-method-commission-line-link.ts`
   (`orderShippingMethod.id → commission_line.shipping_method_id`, alias
   `commission_lines`, `readOnly`, `isList`) so shipping lines are
   navigable from their shipping method.
4. **Service** (`getCommissionLines`) — stop overloading `item_id` for
   shipping; write shipping lines with `shipping_method_id` set and
   `item_id = null`.

This keeps every commission line navigable (item lines via the line-item
link, shipping lines via the new shipping-method link), and the payout
reducer (Gap 4) sums **both** sets for the order.

## Global Commission = the rule-less default rate

The Global Commission (a marketplace-wide default) is modeled as the
**existing rule-less `CommissionRate`** — `getCommissionLines` already
treats a rate with no rules as the default (`service.ts:74`, `:148`). **No
new entity.** But nothing today enforces *exactly one* rule-less rate, so
the backend must expose "the default" as a **singleton** the UI can
read/update deterministically.

**Decision (confirmed).** Add an **`is_default: boolean`** flag (default
`false`) on `CommissionRate`. Exactly one rate carries `is_default =
true` — the Global Commission. Provide:

- A way to **read the single default rate** (filter `is_default = true`).
- **Update** of the default writes `type`, `value` / `values[]`,
  `include_tax`, `include_shipping`, `code` — and never carries rules.

The default rate is **seeded by the migration** (not lazy-created at
runtime) — see §"Backend changes" — so the Global Commission card always
has a record to read. **No dedicated endpoint** is added: the default is
**read** via the existing list with `?is_default=true` and **updated**
via the existing `POST /admin/commission-rates/:id`. The `is_default`
filter is added to the list validators/middleware.

## Gap 4 — recalculation on returns / claims / exchanges (lifecycle)

> Surfaced by the post-purchase audit (and corroborated by the operator
> consultation: *"jeżeli był zwrot zamówienia, to automatycznie też zwrot
> prowizji"* — a return must proportionally return commission). This is a
> **wiring + idempotency** gap, independent of the Figma redesign but
> landing on the same code paths, so it ships with this spec.

**Today.** Commission is recalculated by
`refreshOrderCommissionLinesWorkflow`
(`packages/core/src/workflows/commission/workflows/refresh-order-commission-lines.ts`)
from exactly **two** triggers:

- order placement (`complete-cart-with-split-orders.ts`), and
- **order edit confirmed** —
  `packages/core/src/subscribers/order-edit-confirmed.ts` on
  `OrderEditWorkflowEvents.CONFIRMED`.

**Returns, claims, and exchanges do NOT recalculate commission.** The
`link-order-line-items-to-offers` subscriber already fires on
`OrderWorkflowEvents.EXCHANGE_CREATED` / `CLAIM_CREATED`
(`subscribers/link-order-line-items-to-offers.ts:111-114`) — but only to
**attach offers** to the new line items, never to refresh commission. So
after a return/refund the seller's commission base is stale, and there is
no commission claw-back at all.

**Decision — close the gap with five concrete changes:**

1. **Subscribe the refresh to the post-purchase events.** Add the
   return/claim/exchange confirmed/received events
   (`OrderWorkflowEvents.RETURN_RECEIVED`, `CLAIM_CREATED` (+ confirmed),
   `EXCHANGE_*`) as triggers for `refreshOrderCommissionLinesWorkflow` —
   not just `OrderEditWorkflowEvents.CONFIRMED` — so the commission base
   tracks the post-return item subtotals. (Either extend the existing
   `order-edit-confirmed` subscriber's `event` array or add a dedicated
   `order-commission-refresh` subscriber.)
2. **Make the refresh idempotent (replace, not append).** Today
   `getCommissionLinesStep` emits `CreateCommissionLineDTO`s with **no
   `id`** (`service.ts:128` — only `item_id`/`code`/`rate`/`amount`), and
   `upsertCommissionLinesStep` upserts **by primary key**
   (`steps/upsert-commission-lines.ts` → `service.upsertCommissionLines`,
   `service.ts:209`). With no id and **no unique on `item_id`**, every
   refresh **inserts new rows** → commission lines accumulate on each edit
   or return. Fix: **delete-then-insert** — the refresh deletes the order's
   existing commission lines, then inserts the freshly computed ones (a new
   `deleteCommissionLinesForOrder` / `...ForItems` step before
   `upsertCommissionLinesStep`). Fully idempotent; no unique index needed.
3. **Make recalc return-aware (net subtotal).** Base each item's
   commission on its **net** subtotal after returns/refunds. `item.subtotal`
   already nets adjustments on **edit**, but **returns and claims carry
   their own item rows** the refresh does not read today — the workflow's
   `orderFields` (`refresh-order-commission-lines.ts:12-42`) must be
   extended to cover return/claim/exchange item lines so the recomputed
   base reflects what the customer actually kept.
4. **Fix the payout reducer to read the real relation(s).**
   `create-payout.ts` requests `items.commission_lines.*` (plural/array,
   `:28`) but the reducer reads `item.commission_line?.amount` (singular,
   `:46`) → `totalCommission` collapses to `0` and the payout deducts no
   commission. Sum the actual `items.commission_lines[]` **and**
   `shipping_methods.commission_lines[]` (the shipping lines via the new
   shipping-method link — §"Commission-line linking") so the seller payout
   = order total − (item + shipping commission).

**Out of scope here:** the "give back then claw back" accounting flow
(correcting invoice / negative balance) and the 60-day order-close window
are operator-policy concerns beyond commission recomputation — note them,
don't build them.

## Backend changes

1. **Model** (`models/commission-rate.ts` + new
   `models/commission-rate-value.ts`) —
   - add `include_shipping: model.boolean().default(false)`;
   - add the `CommissionRateValue` child + `CommissionRate.values`
     `hasMany` for per-currency **Fixed** amounts (keep scalar `value`
     for **Percentage**) — see Gap 2;
   - add **`is_default: model.boolean().default(false)`** (the Global
     Commission marker — confirmed);
   - **drop `min_amount`, `priority`, `target`** (and the
     `shipping_option_type` rule reference / shipping-rate pool).
   - Generate the migration with the Medusa migration generator
     (new `commission_rate_value` table + new columns + **drop** the
     three removed ones) and update `.snapshot-medusa-commission.json`.
   - **Seed the default rate in the migration** — insert exactly one
     `CommissionRate` with `is_default = true` if none exists yet
     (idempotent `WHERE NOT EXISTS (... is_default = true)`), with sane
     defaults (`type = percentage`, `value = 0`, `include_tax = false`,
     `include_shipping = false`, a reserved `code`, no rules). This
     guarantees the Global Commission card always has a record to read.
2. **Commission line + links** (`models/commission-line.ts`,
   `links/`) — add nullable **`shipping_method_id`**, make **`item_id`
   nullable** (exactly-one-of CHECK), keep the line-item link, add the
   `shipping-method-commission-line-link.ts` — see §"Commission-line
   linking". Migration alters `commission_line` accordingly.
3. **Matching** (`service.ts` `getCommissionLines`) —
   - **item lines**: replace OR-any matching with **group-by-`reference` →
     AND-across-groups, OR-within-group**; base = `item.subtotal`
     (+ `item.tax_total` when `include_tax`);
   - **shipping lines**: when the **default/global rate's**
     `include_shipping = true`, emit a line **per shipping method** keyed on
     `shipping_method_id` (with `item_id = null`), base =
     `shipping_method.subtotal` (+ `tax_total` when `include_tax`), using
     the global rate's type/value — resolved **independently of items**
     (mirrors Medusa shipping-tax resolution; see Gap 1 / Q1);
   - for Fixed rates, select the amount for the order `currency_code`
     from the per-currency `values`;
   - keep the default-rate (no rules) path; **remove the `target`-based
     rate pool and `min_amount` flooring** (the item/shipping split now
     lives on the commission line, not the rate);
   - tie-break is deterministic by specificity, then `created_at` ASC
     (see Gap 3) — no `priority`.
4. **Validators** (`api/admin/commission-rates/validators.ts`) — extend
   `AdminCreateCommissionRate` / `AdminUpdateCommissionRate` with
   `include_shipping` and the per-currency `values[]` shape. `code` stays
   **required** on create (user-entered, unique). Keep `rules`
   (create-with-rules round-trip).
5. **Query config** (`query-config.ts`) — expose `include_shipping`,
   `values.*`, `code`, and `is_default` in `adminCommissionRateFields`.
6. **Workflows** — thread the new fields through
   `createCommissionRatesWorkflow` / `updateCommissionRatesWorkflow`;
   confirm `batchCommissionRulesWorkflow` still serves scope-dimension
   edits for SPEC-012.
7. **Guard the default rate against deletion** —
   `deleteCommissionRatesWorkflow` (and `DELETE /admin/commission-rates/:id`)
   must **reject** deleting a rate with `is_default = true` — throw a
   `MedusaError` (`NOT_ALLOWED`) before the delete step runs, so the
   Global Commission can never be removed. (The default may still be
   *updated*, just not deleted; it never carries rules.)
8. **Recalculation lifecycle (Gap 4)** —
   - subscribe `refreshOrderCommissionLinesWorkflow` to
     `RETURN_RECEIVED` / `CLAIM_CREATED` (+ confirmed) / `EXCHANGE_*`
     (extend `order-edit-confirmed.ts` or add an
     `order-commission-refresh` subscriber);
   - make the refresh **idempotent** — **delete-then-insert** the order's
     commission lines (item **and** shipping) in
     `refresh-order-commission-lines.ts` (new delete step before
     `upsert-commission-lines.ts`);
   - extend the workflow's `orderFields` to cover return/claim/exchange
     item rows so the recomputed base is **net** of returns;
   - fix `create-payout.ts` to sum `items.commission_lines[]` **and**
     `shipping_methods.commission_lines[]` (not the singular
     `item.commission_line`).
9. **Docs** — update `apps/docs/core-concepts/commission.mdx` for the new
   base (tax + shipping), per-currency Fixed, AND-across-dimension
   semantics, the item/shipping commission-line linking, and the
   recalculation-on-returns lifecycle.

## API contract (consumed by SPEC-012)

After this spec, the admin commission endpoints expose:

- `CommissionRate` carries `include_shipping`, the `values[]` per-currency
  Fixed amounts (`{ currency_code, amount }`), `is_default`, and `code`,
  alongside the existing `type` / `value` (percentage) / `include_tax` /
  `is_enabled` / `rules[]`.
- **Create** accepts `{ name, code, type, value | values[], include_tax,
  include_shipping, rules[] }` (`code` required), persisting all
  dimension-grouped rules in one call.
- **Update** accepts the same partial set (incl. `code`).
- The **default rate** (`is_default = true`, seeded by the migration) is
  **read** via `GET /admin/commission-rates?is_default=true` and
  **updated** via `POST /admin/commission-rates/:id` (no dedicated
  endpoint), and **cannot be deleted** — `DELETE` on it is rejected.
- Matching honors AND-across-dimension and per-currency Fixed; commission
  is emitted as **item lines** (`item_id`) and, when `include_shipping`,
  **shipping lines** (`shipping_method_id`) navigable from their order
  line item / shipping method respectively.

## Integration tests (`integration-tests/http/commission/admin/`)

1. **Shipping commission line** — with the **default/global rate's**
   `include_shipping = true`, the order gets a **shipping commission line**
   per shipping method (`shipping_method_id` set, `item_id` null) navigable
   via the shipping-method link, computed at the **global rate**; with
   `false`, no shipping line is emitted. The shipping line is **independent
   of item rates** — items matching a different scoped rate do not change
   the shipping line. Item lines are unaffected. (Alongside existing
   tax-included coverage.)
2. **Per-currency Fixed** — a fixed rate with `{EUR, USD}` amounts emits
   the EUR amount for an EUR order and the USD amount for a USD order.
3. **AND-across-dimension** — a *Store + Product Type* rule (stores {A},
   types {T}) matches an item only when it is **both** sold by A **and**
   of type T; matching only one dimension does **not** match.
   OR-within-dimension: stores {A, B} matches items from either.
4. **Default rate** — the migration-seeded `is_default = true` rate
   applies to all items (Global Commission path); exactly one default is
   resolved; updating it edits the singleton (and never adds rules).
5. **Create-with-rules round-trip** — `POST /admin/commission-rates`
   with `code` + grouped `rules` (a combo) persists all dimensions and
   reads back grouped; create **without `code`** is rejected (required).
6. **Specificity tie-break** — when both a 2-dimension rate and a
   1-dimension rate match one item, the **2-dimension** rate wins; two
   equally specific matches break on `created_at` ASC. (Replaces the old
   `priority` ordering.)
7. **Default rate is undeletable** — `DELETE /admin/commission-rates/:id`
   on the `is_default = true` rate is **rejected** (error, rate still
   present); deleting any non-default rate still succeeds.
8. **Idempotent refresh** — running `refreshOrderCommissionLinesWorkflow`
   twice on the same order leaves **one** commission line per item (and per
   shipping method) — no duplicate accumulation.
9. **Recalc on return** — after a partial return, the affected item's
   commission line is recomputed on the **net** (kept) subtotal; a full
   return drops the item's commission to zero.
10. **Payout deducts item + shipping commission** — `createPayoutWorkflow`
    produces `payout.amount === order.total − Σ (item + shipping)
    commission_lines.amount` (proves both the singular→array fix and the
    shipping-line summation).
11. **Shipping line navigable** — a shipping commission line resolves from
    its shipping method via the new link (`shipping_methods.commission_lines`)
    and **not** from any line item.

## User-Visible Behavior

(Backend-only — observable through the admin API and computed
commissions.) Commission is computed on a base that optionally folds in
**tax** and **shipping**; **Fixed** rates carry an amount **per store
currency**; a rule applies only when **all** of its chosen scope
dimensions (store / product type / category) match; and a single
**default** commission applies when no rule matches. Commission is
**recalculated on order edits, returns, claims, and exchanges** — the
seller's commission tracks what the customer actually kept — so a
returned order proportionally returns commission to the seller. The
seller payout equals the order total minus the computed commission.

## Verification

> Cannot run until the backend lands. Record evidence below.

1. **Integration suite** — `bun run test:integration:http --
   http/commission/admin` passes all cases in §"Integration tests".
2. **Migration** — generated migration applies cleanly; the snapshot is
   updated; existing rates load with `include_shipping=false` and the
   legacy single-currency value intact; the dropped columns
   (`min_amount` / `priority` / `target`) and any `shipping_option_type`
   rules are removed without orphaning data; `commission_line` gains
   nullable `shipping_method_id` and `item_id` becomes nullable (existing
   lines keep `item_id`); **exactly one `is_default = true` rate is
   seeded** (and re-running the migration does not create a second).
3. **Matching parity** — existing tax-included and default-rate behavior
   is unchanged; new behavior (shipping commission line, per-currency
   Fixed, AND-across-dimension, specificity tie-break) is covered.
4. **Build & lint** — `bun run build` and `bun run lint` pass (no new
   errors in authored files).

## Evidence

### Implemented (2026-06-16) — branch `claude/sharp-germain-6a2615`

**Types** (`packages/types/src/commission/`):
- `common.ts` — dropped `CommissionRateTarget`; `CommissionRateDTO` drops
  `target`/`min_amount`/`priority`, adds `include_shipping`/`is_default`/
  `values?`; new `CommissionRateValueDTO`; `CommissionLineDTO.item_id`
  nullable + new `shipping_method_id`; `CommissionCalculationShippingLine`
  drops `shipping_option`; `CreateCommissionLineDTO` item_id optional +
  `shipping_method_id`.
- `mutations.ts` — Create/Update rate DTOs drop the removed fields, add
  the new ones. `rules`/`values` intentionally **not** typed on the DTO
  (Medusa auto-create types a hasMany as `string[]`; nested objects flow
  through at runtime, as the legacy `rules` already did).

**Module** (`packages/core/src/modules/commission/`):
- `models/commission-rate.ts` — `+ is_default`, `+ include_shipping`,
  `+ values` hasMany; `- priority`, `- target`, `- min_amount`.
- `models/commission-rate-value.ts` — **new** Price-shaped child
  (`currency_code` + `amount` bigNumber, belongsTo rate).
- `models/commission-line.ts` — `item_id` nullable, `+ shipping_method_id`.
- `service.ts` — registers `CommissionRateValue`; `getCommissionLines`
  rewritten: AND-across-dimension / OR-within-dimension matching,
  specificity tie-break (more dimension groups, then `created_at` ASC),
  per-currency Fixed via `values`, shipping lines emitted per shipping
  method from the **default rate** when `include_shipping` (item_id null,
  shipping_method_id set), no `target` pool, no `min_amount` floor. Added
  `deleteCommissionLinesForOrderItems`.
- `loaders/seed-default-commission-rate.ts` — **new** boot loader that
  idempotently ensures the `is_default` rate exists (the test infra applies
  schema from models, not migration data, so the loader — not the migration
  seed — is what reliably creates it; both are guarded by `is_default`).
- `migrations/Migration20260615120000.ts` — alters `commission_rate`
  (+ include_shipping/is_default, drop priority/target/min_amount/
  raw_min_amount), creates `commission_rate_value`, alters `commission_line`
  (item_id nullable + shipping_method_id + exactly-one CHECK + indexes),
  seeds the default rate.

**API** (`api/admin/commission-rates/`): validators drop removed fields,
add `include_shipping`/`is_default`/`values[]` + `is_default` list filter
(code stays required); query-config swaps fields + exposes `values.*`.

**Workflows / links / subscriber / payout:**
- delete guard — `steps/validate-commission-rates-deletable.ts` rejects
  deleting the `is_default` rate, wired into `deleteCommissionRatesWorkflow`.
- idempotent refresh — `steps/replace-commission-lines.ts` (delete-then-
  insert) + `refresh-order-commission-lines.ts` collects item/shipping ids
  and replaces.
- recalc lifecycle — `subscribers/order-edit-confirmed.ts` now fires on
  `OrderEditWorkflowEvents.CONFIRMED` + `RETURN_RECEIVED` / `CLAIM_CREATED`
  / `EXCHANGE_CREATED`.
- new link `links/shipping-method-commission-line-link.ts`
  (`orderShippingMethod.id → commission_line.shipping_method_id`); existing
  line-item link kept.
- `create-payout.ts` sums `items.commission_lines[]` **and**
  `shipping_methods.commission_lines[]`.

**Verification:**
- `bun run build` (turbo, all packages) → **9/9 successful**.
- `bun run lint` → clean for all newly authored files.
- `bun run test:integration:http -- commission-rates` → **23/23 passed**
  (incl. per-currency Fixed create, include_shipping create/update,
  `is_default` filter exposes exactly the seeded default, and the
  default-rate delete-guard).

### Deviations from the draft
1. **Default rate ensured by a module loader, not (only) the migration
   seed.** The migration still seeds it, but the integration-test infra
   builds schema from the models and does not run migration data steps, so
   the boot loader is the reliable mechanism. Both are idempotent and
   guarded by `is_default`, so they never double-create.
2. **`currency_code` kept on the rate** (not in the spec's removed list) —
   legacy single-currency rates still filter by it; new rates leave it null
   and use `values` for Fixed.

### Gap-4 tests + snapshot (2026-06-16, follow-up)

- **`integration-tests/http/commission-rates/admin/commission-calculation.spec.ts`**
  (7 cases) — added: shipping line emitted from the default rate only when
  `include_shipping` (item_id null / shipping_method_id set); per-currency
  Fixed resolves the right amount per currency; AND-across-dimension (both
  dims match → scoped rate, one dim → default); specificity tie-break
  (2-dim beats 1-dim); refresh **idempotency** (run twice → one line per
  item and per shipping method); item/shipping lines **anchored** correctly
  (+ item line navigable via the `order.items.commission_lines` link); and
  `sumCommissionForOrderItems` totals item + shipping commission = exactly
  what `createPayoutWorkflow` deducts. Both commission suites: **30/30**.
- **Snapshot** `.snapshot-medusa-commission.json` updated by hand to match
  the models (`commission_rate`: −priority/−target/−min_amount,
  +include_shipping/+is_default; new `commission_rate_value` table;
  `commission_line`: item_id nullable + shipping_method_id + exactly-one
  CHECK). `medusa db:generate` produced no diff for the symlinked plugin
  module in this env, so the snapshot was reconciled manually (it only
  feeds future generator diffs).

### Review follow-ups (2026-06-16)

**Idempotent refresh folded into `upsertCommissionLines`.** Instead of a
separate replace step + method, the module's auto-generated
`upsertCommissionLines` is **overridden** with replace semantics: it derives
the anchors (`item_id` / `shipping_method_id`) from the incoming lines,
deletes existing lines for those anchors, then inserts — one transaction.
The computed lines carry no `id`, so a plain primary-key upsert would
duplicate them; deleting by anchor first makes the refresh idempotent. The
`replace-commission-lines` step + `deleteCommissionLinesForOrderItems`
method were removed; `refresh-order-commission-lines` now just calls
`upsertCommissionLinesStep`.

**Order → commission line: a cross-module link cannot serve this.** A
read-only link (`defineLink` and `MedusaModule.setCustomLink` both tested)
resolves `order.items.commission_lines` but **not**
`order.shipping_methods.commission_lines`. Root cause (traced through the
remote joiner): two cross-module relations pointing at the **same target
entity** (`commission_line`) **collide when co-resolved** — the joiner
reuses the first-resolved relationship's join key (`item_id`) for both, so
the shipping side runs `commission_line WHERE item_id IN (shipping_method_ids)`
→ `[]`. Queried **alone** each resolves; **co-requested** the shipping side
fails; a **shared alias** fails even alone. This is a genuine joiner
constraint, not a config error. **The link file was removed.**

**Commission is read by querying the `commission_line` entity directly** —
the supported cross-module pattern (mirrors Medusa's loyalty/gift-card,
which queries its own module by id rather than navigating the order graph).
Two consumers:

- **Payout** — `createPayoutWorkflow` totals commission via
  `useQueryGraphStep({ entity: "commission_line", filters: { $or: [
  { item_id }, { shipping_method_id } ] } })` and sums in a transform
  (`payout.amount = order.total − Σ amount`). The earlier
  `sumCommissionForOrderItems` method + `getOrderCommissionTotalStep` were
  removed in favour of the plain query.
- **Order detail endpoints (new)** —
  `GET /admin/orders/:id/commission-lines` and
  `GET /vendor/orders/:id/commission-lines` (vendor seller-scoped via the
  order↔seller link) return an order's item **and** shipping commission
  lines. Backed by a shared
  `packages/core/src/api/utils/order-commission-lines.ts` helper that
  resolves the order's item/shipping ids then queries `commission_line` by
  `$or`. Integration-covered (returns 2 lines, total 15, one shipping line).
  The vendor + admin **order-detail UIs** render a **Commission** section
  from these endpoints (`useOrderCommissionLines` hook → per-line breakdown
  + total) — see SPEC-012.

### Remaining (not yet done)
- Full end-to-end `createPayoutWorkflow` test (needs a seller payout
  account + provider seeding); the deduction **math** is covered by the
  payout-total query test + the `commission-lines` endpoint test.
- Recalc-on-return **net** subtotal end-to-end (needs the return flow);
  the refresh wiring + idempotency are covered. Return-aware `orderFields`
  still relies on Medusa's net `item.subtotal`; revisit if returns don't net.

## Open questions

1. **Q1 — governing rate for the shipping line. (Resolved ✅)** The
   shipping line (per shipping method, `shipping_method_id`) is governed by
   the **default/global rate**, resolved **independently of the items** the
   method ships — mirroring Medusa shipping-tax resolution
   (`tax-module-service.ts::getTaxRateQueryForItem`: a shipping method
   matches `reference = "shipping_option"` **OR** `is_default`, region-scoped,
   never item-derived). We dropped shipping-specific commission rules, so
   only the default branch remains. The "inherit from the items shipped"
   alternative is **rejected** — Medusa explicitly does not do that.
2. **Q2 — specificity tie-break. (Resolved ✅)** Gap 3's tie-break — "more
   dimension groups wins, then `created_at` ASC" (no `priority`) — is
   accepted: *Store + Category* always outranks a bare *Store* rule. (If a
   configurable order is ever needed, `priority` would be re-introduced as
   a **new** field.)
3. **Q3 — default-rate marker. (Resolved ✅)** `is_default: boolean` flag
   on `CommissionRate`, **seeded by the migration** (not lazy-created).
4. **Q4 — default endpoint shape. (Resolved ✅)** No dedicated endpoint.
   The default rate is created by the migration, **read** via the existing
   list endpoint with `?is_default=true`, and **updated** via the existing
   `POST /admin/commission-rates/:id`.
5. **Q5 — dropping shipping-option rules. (Resolved ✅)** `target` + the
   `shipping_option_type` reference are **dropped** outright — no
   conversion path; the new design has no shipping rule type.
6. **Q6 — recalc idempotency mechanism. (Resolved ✅)** **Delete-then-
   insert**: the refresh deletes the order's existing commission lines,
   then inserts freshly computed ones — fully idempotent, no unique index
   needed.

## Notes

- The model **changes** here (Gaps 1–3) — unlike SPEC-009/010 which
  reshaped a surface over an unchanged model — so this is a real
  migration: it **adds** `include_shipping` + per-currency fixed storage +
  the `is_default` marker (and seeds the default rate), and **drops**
  `min_amount`, `priority`, `target`, and the `shipping_option_type` rule
  path (the fields the new design does not use). `code` is kept and is a
  **user-editable, required** field.
- The drop is **breaking** for any consumer reading those columns or
  authoring shipping-target rates — call it out in the PR.
- SPEC-012 (admin UI) **must not** ship ahead of this spec's contract;
  the wizard, Global card, and rule detail all read fields defined here.
