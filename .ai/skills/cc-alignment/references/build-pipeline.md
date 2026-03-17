# Build Pipeline — tsup + DTS

## How admin package is built

- **Tool**: `tsup` (config in `packages/admin/tsup.config.ts`)
- **Entry points**: `src/index.ts`, `src/index.css`, `src/pages/index.ts`
- **Format**: ESM only
- **DTS**: Enabled — generates `.d.ts` files alongside `.js`
- **Output**: `dist/` directory

## Package exports (`package.json`)

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./pages": {
      "types": "./dist/pages/index.d.ts",
      "import": "./dist/pages/index.js"
    }
  }
}
```

Consumers import via `@mercurjs/admin/pages` which resolves to `dist/pages/index.js`.

## DTS build is all-or-nothing

**Critical**: DTS build fails if ANY file reachable from entry points has a TS error. This means pre-existing errors in unrelated files (e.g., `order-detail.tsx`) will block DTS generation for `pages/index.ts`.

### Common DTS blockers and fixes

| Error | Root cause | Fix |
|-------|-----------|-----|
| `$id` missing from query type | SDK hook type includes `$id` but hook adds it internally | `Omit<InferClientInput<...>, "$id">` on the hook's query param |
| `InventoryNext` not found | Removed namespace in `@medusajs/types` v2 | Replace with `HttpTypes.AdminInventoryItem` |
| `Property 'rules' not on AdminPrice` | Runtime API field not in SDK types | Safe cast: `((p as unknown) as { rules?: Record<string, unknown> }).rules` |
| `Property 'inventory' not on AdminProductVariant` | Wrong property name | Use `inventory_items` (correct field name) |
| `InventoryItemDTO` not found | Old import path | Use `HttpTypes.AdminInventoryItem` |

### Fix strategy

1. **Never use `any`** to silence DTS errors
2. Use `Omit<>` when a hook internally adds fields the consumer shouldn't pass
3. Use `HttpTypes.*` when old type imports are broken
4. Use safe casts (`as unknown as { field: Type }`) only for runtime-only fields missing from types
5. Fix at the source (hook definition, type definition) — not at the call site

## Build commands

```bash
# Full build (ESM + DTS)
npx tsup

# Quick build without types (for testing ESM output)
npx tsup --no-dts

# Dev mode (watch)
npx tsup --watch
```

## Verification after build

```bash
# Check new exports exist in built output
grep "ProductListPage\|ProductDetailPage" dist/pages/index.js

# Check DTS was generated
ls -la dist/pages/index.d.ts

# Check file size (should be > 0)
wc -c dist/pages/index.d.ts
```

## Testing registry integration

After rebuild, the testing registry (`mercur-testing-registry/apps/admin/`) picks up changes via workspace linking. If dev server is running, it needs a page reload (Vite HMR doesn't always catch `dist/` changes from linked packages).

If UI behavior appears unchanged after code fixes (e.g., duplicate sections still visible), force a clean rebuild of `@mercurjs/admin` and restart/reload the consumer app before debugging further.
