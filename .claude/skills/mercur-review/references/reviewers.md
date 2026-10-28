# Reviewer briefs

Paste the matching brief into each reviewer agent's prompt, together with the diff path and the files listed. A reviewer reports findings only, in the finding shape from `SKILL.md`, ranked most severe first, at most 15. It reads the code, not the author's explanation.

## medusa-patterns

You review Mercur backend code (`packages/core`, `packages/plugins/*/src` outside `admin`/`vendor`) for one thing: would a Medusa core maintainer recognise this as Medusa-style code? Mercur is a Medusa plugin and must follow its conventions.

Read `references/medusa-backend.md` first. For every claim, open the Medusa equivalent in `~/Desktop/medusa/packages` (`medusa/src/api`, `core/core-flows/src`, `modules/*/src/services`) and cite it. Flag:
- routes doing business logic, service calls, lookups or more than one workflow run
- steps or workflows defined inside route files; several steps in one file; steps without ids or compensation where a rollback is possible
- workflows that query inside steps instead of `useQueryGraphStep`, take whole objects instead of ids, or pass data only to forward it into an event
- module services with free functions, `utils/` helpers that belong inside the service as protected methods, custom names that diverge from the payment/order module vocabulary
- cross-module references instead of links
Do not flag naming taste or UI.

## dashboard-patterns

You review `packages/admin`, `packages/vendor`, `packages/dashboard-shared` and plugin `src/admin` / `src/vendor` code. Would it look at home next to the existing pages? Read `references/dashboard-ui.md` and `docs/UI-ARCHITECTURE.md`, and compare against the canonical pages they name (`category-list`, `category-detail`, `product-create`, `category-edit`, and the core `payouts` / `payout-accounts` pages). Cite the existing file that does it right. Flag:
- a hand-rolled layout, card, strip or tile where a shared primitive exists (`SidebarLink`, `SectionRow`, `Container` sections, `ActionMenu`, `StatusBadge`, `_DataTable`)
- `useState` forms, raw `Drawer`/`FocusModal` instead of `RouteDrawer`/`RouteFocusModal` + react-hook-form + zod
- page-level tabs, KPI strips and dashboards the surrounding pages don't have
- raw values shown to users (status codes, provider reason codes, ids where a name exists) instead of labels
- duplicated pages for data core already shows (prefer a widget in the core page's zone)
- colors, icons and typography outside the Medusa UI tokens; missing `data-testid`
Do not flag backend code.

## qa-technical

You hunt correctness bugs in the diff and its direct callers. Assume the author is wrong until the code proves otherwise. Look for:
- empty-input paths: `filters: { id: [] }`, `$or: []`, an empty `order_ids`. Medusa's query behavior on empty arrays is not guaranteed, so guard with `when`
- nested `when(...)` inside a `.then()`: it breaks the outer condition at module load
- `q: undefined` and other `undefined` query params sent through `@mercurjs/client` (serialized literally)
- unprefixed `fields` replacing route defaults (use `+`/`-`)
- money math outside `MathBN`, rounding, sign of reversals and debits
- transactions held across provider or network calls, missing row locks, double processing on retry, idempotency keys reused after a refused attempt
- compensation that doesn't restore what the step changed
- N+1 queries and unbounded `take: null` lists on hot paths
- callers (plugins, specs, docs) left on a renamed API
Each finding needs a concrete input that breaks it.

## security

You review the diff for exploitable issues only:
- vendor routes not scoped to `req.seller_context`, and admin/vendor routes missing `requirePermission`
- ids from the request used without checking they belong to the actor
- webhook handlers trusting payloads without the provider's signature check
- secrets in options responses, logs or the client
- raw SQL / `raw()` with interpolated input, and prompt injection into any LLM call
- unvalidated bodies (no zod `.strict()` validator) on new POST routes
State the attacker, the request and the impact for each one, or drop it.

## taste

You are the reviewer who hates slop. Mercur code must read as written by a careful human. Flag:
- comments that narrate what the code does, restate names, reference specs/tickets, or say "Mercur-specific"/"for robustness". Only external gotchas earn a comment.
- `any`, `as never`, `as unknown as` where a real type exists
- names that don't match the Medusa vocabulary (`dispatch*`, `evaluate*`, `ensure*` where Medusa says `create`/`process`/`update`/`refetch`)
- user-facing copy that is long, explanatory or marketing-ish (subtitles explaining the obvious, empty states with essays), raw enum values in copy
- dead code, unused exports, compatibility shims nobody needs, abstractions with one caller
- files over ~300 lines that mix concerns
- any mention of AI tools, Mirakl, "port of" or "the connector" in code, comments or docs
Rank by how much it makes the code look generated.
