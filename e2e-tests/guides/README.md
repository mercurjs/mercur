# User Guide generator

Generates the **User Guide** docs pages (`apps/docs/user-guide/**`) and their
screenshots (`apps/docs/images/user-guide/**`) by driving the real Admin and
Vendor panels with Playwright. One guide definition is the single source of
truth for a page: it produces both the screenshots and the MDX, so a guide can
never drift from the actual UI. If a selector breaks, generation fails loudly,
which doubles as a UI regression signal.

```
definition (define-guide) ──► runner (Playwright drives :admin / :vendor)
                                     │
                        screenshots ─┴─ MDX  ──►  apps/docs
```

## Run it

Prerequisites match the e2e suite: a local Postgres reachable with the `DB_*`
vars in `.env.test`, and the Playwright browser installed.

```bash
cd e2e-tests
bun install
bun run e2e:install        # once, installs chromium
bun run guides             # generate every registered guide
bun run guides:ui          # same, with the Playwright inspector (great for finding selectors)
```

The generator:

1. Boots an ephemeral Postgres DB, migrates it, and seeds it with the **apps/api
   demo catalog** (`apps/api/src/scripts/seed.ts`) plus an admin user, via
   `guide-seed.ts`.
2. Starts Medusa + both dashboards on random ports (reuses `src/stack`).
3. For each guide in `registry.ts`: logs into the panel, runs the steps, writes
   screenshots to `apps/docs/images/user-guide/<panel>/<slug>/step-N.png`, and
   writes `apps/docs/user-guide/<panel>/<slug>.mdx`.
4. Tears the stack and DB down.

Commit the generated `.mdx` and `.png` files under `apps/docs`.

## Logins

Driven by `credentials.ts`, matching what the seed creates:

- **admin** panel — `admin@medusa.js` / `somepassword` (created by `guide-seed.ts`)
- **vendor** panel — `seller@mercur.dev` / `supersecret` (primary demo seller)

## Add a guide

1. Copy `definitions/example.configure-commissions.ts` to
   `definitions/<slug>.ts`.
2. Fill in `steps`. Prefer `{ testid: "..." }` selectors — every interactive
   element carries a `data-testid` (see `docs/UI-ARCHITECTURE.md`). Find exact
   ids in `packages/{admin,vendor}/src/pages/...`, or run `bun run guides:ui` and
   inspect. Use `mask` for dynamic/PII regions and `highlight` to spotlight the
   control being used.
3. Register it in `registry.ts`:
   ```ts
   import configureCommissions from "./definitions/configure-commissions"
   export const GUIDES: GuideDefinition[] = [configureCommissions]
   ```
4. `bun run guides`, then review the generated page in the docs preview
   (`cd apps/docs && npx -y mint@latest dev --port 3333`).

## Step reference

Each step runs its actions in order, then screenshots:

| Field       | Purpose                                                          |
| ----------- | --------------------------------------------------------------- |
| `title`     | `<Step title>` heading                                          |
| `body`      | Markdown shown above the screenshot                             |
| `goto`      | Navigate to a path (relative to the panel base URL)             |
| `waitFor`   | Wait for an element to be visible before acting/shooting        |
| `fill`      | Fill inputs: `[{ target, value }]`                              |
| `select`    | Choose a `<select>` option                                      |
| `click`     | Click an element                                                |
| `press`     | Press a keyboard key                                            |
| `mask`      | Grey out regions in the screenshot (dates, ids, emails)         |
| `highlight` | Outline the acted element                                       |
| `shot`      | `"full"` (default), `"viewport"`, `{ element }`, or `false`     |

A `Target` is one of `{ testid }`, `{ role, name? }`, `{ label }`,
`{ placeholder }`, `{ text }`, `{ css }`.

## Notes

- The generator does not run the e2e journeys and vice versa; they use separate
  Playwright configs and seeds. The shared `src/stack` was made seed-swappable
  (`startStack({ seedExec })`) so both reuse the same boot logic.
- Screenshots force the dark theme and a 1440×900 @2x viewport for crisp,
  diff-stable images. Adjust in `playwright.guides.config.ts`.
- The stack does not run inside a `.claude/worktrees` worktree (bun install
  layout); run the generator from a normal checkout or in CI.
