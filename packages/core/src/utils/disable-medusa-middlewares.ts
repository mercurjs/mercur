import { existsSync, readdirSync } from "fs"
import { dirname, join } from "path"
import resolveCwd from "resolve-cwd"
import pkgDir from "pkg-dir"

// Medusa's `dist/api/middlewares.js` is a single aggregator that statically
// requires every sub-middleware file (e.g. `./store/carts/middlewares`) and
// spreads each one's exported array into a flat list. Mercur replaces some
// of those modules wholesale (products), and partially overrides others
// (carts). Overriding route handlers is trivial in Medusa (file-based,
// plugin scanned after core), but middlewares can't be overridden the same
// way — hence this patch.
//
// We preload each listed sub-middleware module and empty its exported array
// in place BEFORE Medusa's aggregator runs. The aggregator then spreads an
// empty array. For files where Mercur only overrides a subset of routes
// (carts), the original entries are captured into `ORIGINAL_MIDDLEWARES`
// first so Mercur's own middlewares.ts can re-spread the non-overridden
// ones.
//
// Bun deduplicates each transitive copy of `@medusajs/medusa` under
// `node_modules/.bun/@medusajs+medusa@<ver>+<hash>/`. The framework can
// resolve different copies depending on caller context, so we patch every
// copy we find.

const OVERRIDES: string[] = [
  "dist/api/admin/products/middlewares.js",
  "dist/api/admin/product-variants/middlewares.js",
  "dist/api/admin/product-categories/middlewares.js",
  "dist/api/admin/orders/middlewares.js",
  "dist/api/admin/shipping-options/middlewares.js",
  "dist/api/admin/shipping-profiles/middlewares.js",
  "dist/api/admin/stock-locations/middlewares.js",
  "dist/api/store/products/middlewares.js",
  "dist/api/store/product-categories/middlewares.js",
  "dist/api/store/product-variants/middlewares.js",
  "dist/api/store/carts/middlewares.js",
]

export const ORIGINAL_MIDDLEWARES: Record<string, unknown[]> = {}

function findMedusaDirs(): string[] {
  const dirs = new Set<string>()

  const entry = resolveCwd("@medusajs/medusa")
  const primary = pkgDir.sync(dirname(entry))
  if (primary) dirs.add(primary)

  // Walk up to find `node_modules/.bun/@medusajs+medusa@<ver>+<hash>` copies.
  let cursor = process.cwd()
  while (true) {
    const bunDir = join(cursor, "node_modules", ".bun")
    if (existsSync(bunDir)) {
      for (const entry of readdirSync(bunDir)) {
        if (!entry.startsWith("@medusajs+medusa@")) continue
        const inner = join(
          bunDir,
          entry,
          "node_modules",
          "@medusajs",
          "medusa"
        )
        if (existsSync(join(inner, "package.json"))) dirs.add(inner)
      }
    }
    const parent = dirname(cursor)
    if (parent === cursor) break
    cursor = parent
  }

  return [...dirs]
}

export function disableMedusaMiddlewares(): void {
  for (const medusaDir of findMedusaDirs()) {
    for (const file of OVERRIDES) {
      const filePath = join(medusaDir, file)
      if (!existsSync(filePath)) continue

      let mod: Record<string, unknown>
      try {
        mod = require(filePath)
      } catch {
        continue
      }

      for (const key of Object.keys(mod)) {
        const value = mod[key]
        if (!Array.isArray(value)) continue
        ORIGINAL_MIDDLEWARES[file] = [...value]
        value.length = 0
      }
    }
  }
}
