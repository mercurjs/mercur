# Code Review Checklist

Area-specific checks for mercur code review. Use alongside the main `SKILL.md`.

## API Routes (`packages/core/`, `packages/registry/`)

- [ ] Route handler has concrete generics: `AuthenticatedMedusaRequest<BodyType>`, `MedusaResponse<ResponseType>`
- [ ] Request validation matches the generic body type
- [ ] Response envelope shape is consistent with existing routes
- [ ] New routes are documented or have a docs field in registry.json
- [ ] Middleware is registered (per-resource array pattern for registry blocks)
- [ ] Auth guards are appropriate (authenticated vs public)
- [ ] No `any` on request/response types

## Type Safety (`packages/types/`, shared DTOs)

- [ ] Public types use explicit interfaces, not `Record<string, any>`
- [ ] Generic parameters are concrete, not `any`
- [ ] Exported types don't leak internal implementation details
- [ ] Changes to shared types are backward-compatible (or spec'd)

## Registry Blocks (`packages/registry/`)

- [ ] No imports from `@components/`, `@hooks/`, `@lib/` — use `@mercurjs/dashboard-shared`
- [ ] No barrel `index.ts` in `workflows/` or `steps/`
- [ ] File layout matches CLI `resolveNestedFilePath()` expectations
- [ ] `registry.json` entry has `docs` field with setup instructions
- [ ] External npm dependencies listed in `dependencies` array
- [ ] Pages are `page.tsx` with `export default`
- [ ] Workflows grouped: `workflows/<entity>/steps/` + `workflows/<entity>/workflows/`

## Public Exports & Codegen

- [ ] No silent changes to public package exports or entrypoints
- [ ] Route type codegen generics are present and correct
- [ ] Generated `Routes` types still match after changes
- [ ] CLI command names/options unchanged (or spec'd)

## Admin / Vendor UI (`packages/admin/`, `packages/vendor/`)

- [ ] Forms use `KeyboundForm` with handler-level submit guard
- [ ] i18n: all user-visible strings use `t("...")`
- [ ] `useRouteModal()` is inside `<RouteDrawer>` / `<RouteFocusModal>`, not top-level
- [ ] Loading/error states are preserved after refactoring
- [ ] For detailed UI review, defer to `admin-ui-review` skill

## Database & Migrations

- [ ] Schema changes have migration notes in spec
- [ ] No destructive column drops without migration path
- [ ] Module registration documented for downstream users

## Configuration

- [ ] `medusa-config.ts` changes documented (including `admin-ui`/`vendor-ui` module options if dashboard mounting changed)
- [ ] `blocks.json` alias impact considered
- [ ] Environment variable additions documented
- [ ] `vite.config.ts` changes in `apps/admin` or `apps/vendor` reviewed (plugin config, `medusaConfigPath`)

## Documentation

- [ ] Public-facing behavior changes reflected in docs
- [ ] API examples updated if request/response changed
- [ ] Setup instructions updated if configuration changed
