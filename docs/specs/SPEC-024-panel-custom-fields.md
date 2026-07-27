---
status: passing
canonical: false
priority: 2
area: framework/dx
created: 2026-07-07
last_updated: 2026-07-07
---

# SPEC-024 Custom Fields for `product` (Slice 3 of SPEC-021)

Implements Slice 3 of [SPEC-021](./SPEC-021-panel-extension-api.md): the
model-scoped `defineCustomFieldsConfig` + `createFormHelper` surface (forms,
section `displays`, and the `list` block) for the `product` model, with
`additional_data` persistence. Vendor panel.

## User-Visible Behavior

A developer drops `src/custom-fields/product.tsx` exporting
`defineCustomFieldsConfig({ model: "product", link, forms, displays, list })`.
Custom form fields render in the product edit drawer (submitted under
`additional_data` and persisted), read-only fields/values appear in the product
detail sections, and columns are contributed to the product list — all typed
against the panel's generated `CustomFieldsRegistry`.

## Design / Implementation

- **SDK** (`packages/dashboard-sdk/src/config/custom-fields.ts`):
  `defineCustomFieldsConfig<TModel>` + types (`CustomFieldsConfig`,
  `CustomFormField`, `CustomDisplayEntry`/`CustomDisplayField`, `SectionAction`,
  `CustomListExtension`) and the open `CustomFieldsRegistry` interface. The SDK
  stays **zod-free** — `validation` is a structural `FieldValidation` type;
  `createFormHelper` (the real zod surface) lives in `@mercurjs/dashboard-shared`.
  Crawl: `custom-fields.ts` aggregates each file's default-exported config into
  `virtual:mercur/custom-fields` (configs carry runtime zod/components, so the
  actual objects are re-exported, not build-time-extracted). Wired through
  constants/virtual-modules/plugin/generate-plugin-entry (`customFieldsModule`).
- **Runtime** (`packages/dashboard-shared/src/extensions/`): `ExtensionRegistry`
  gains `getFormFields`/`getAllFormFields`/`getDisplays`/`getListExtension`/
  `getLinks`; `createFormHelper` + `buildAdditionalDataSchema`/`Defaults`;
  `<FormExtensionZone model zone tab control data>` (renders fields under
  `additional_data.<field>` via the `Form.Field → Form.Item` chain);
  `<DisplayExtensionZone model zone data>` + `useDisplayFieldOverride` (add/
  replace/remove section fields + `{ rank?, component }` actions).
- **Mounts (product + login pages only)**: product edit drawer
  (`edit-product-form.tsx`) extends its schema/defaults with the custom fields
  and submits `additional_data`; product detail general section renders
  `<DisplayExtensionZone model="product" zone="general">`.
- **Persistence**: the vendor `POST /vendor/products/:id` route already accepts
  `AdditionalData` (validators wrap `WithAdditionalData`); it now persists
  `additional_data` onto the product's `metadata` (the MVP sink — the built-in
  validators never see the custom keys, so no "Unrecognized fields" rejection).
- **Typed targets**: the panel generator scans `<FormExtensionZone>` /
  `<DisplayExtensionZone>` host usages and emits `CustomFieldsRegistry` (per-model
  `formZones` / `displayZones`) into the shipped `extension-targets.d.ts`.

## Verification

1. `bun run build` — full monorepo green (11/11).
2. Typed targets — `defineCustomFieldsConfig({ model: "product", forms:[{ zone:
   "edit" }] })` compiles; `zone: "nope"` fails `tsc`
   (TS2322: not assignable to `"edit"`).
3. Demo `apps/vendor/src/custom-fields/product.tsx` exercises forms(edit),
   displays(general), and a list column.

## Evidence

- `bun run build`: `Tasks: 11 successful, 11 total` (2026-07-07).
- tsc contract: valid custom-field zone compiles; `"nope"` → `TS2322`.
- Generated `CustomFieldsRegistry.product = { formZones: "edit"; displayZones:
  "general" }`.
- Backend: `packages/core/src/api/vendor/products/[id]/route.ts` persists
  `additional_data` → `product.metadata`; core builds green.

## Notes

- `createFormHelper` lives in `@mercurjs/dashboard-shared` (the SDK is a zod-free
  build-time package) but is authored as part of the SPEC-021 helper family.
- Scope limited to product + login pages per session direction: the create-form
  injection, list bulk-actions wiring, and onboarding zone (Slice 4) are **not**
  mounted; the runtime API (`FormExtensionZone`, `getListExtension`) supports them
  when mounted later. Commands (Slice 5) are out of scope.
- Persistence uses `product.metadata` as the MVP sink; a `link`ed-module workflow
  hook is the follow-up (SPEC-021 §6 leaves the exact hook to the sub-spec).
