import { dirname, join } from "path"
import { defineFileConfig } from "@medusajs/framework/utils"

// Disable Medusa's middleware files for paths Mercur overrides. The router's
// matcher-based `isRouteFileDisabled` check (router.ts:123) walks ALL source
// dirs and treats a matcher as disabled if ANY of them has a disabled
// `route.{ts,js}` at that path. That would suppress Mercur's OWN middlewares
// for the same matcher, so we never disable Medusa's `route.js` here. Plugin
// route handlers naturally take precedence: plugins are scanned after Medusa
// in `loaders/api.ts`, and `routes-loader.ts` keys routes by matcher+method,
// so the plugin's handler overwrites the core one.
const MIDDLEWARE_FILES_TO_DISABLE = [
  "dist/api/admin/products/middlewares.js",
  "dist/api/admin/product-variants/middlewares.js",
  "dist/api/admin/product-categories/middlewares.js",
  "dist/api/store/products/middlewares.js",
  "dist/api/store/product-categories/middlewares.js",
  "dist/api/store/product-variants/middlewares.js",
  "dist/api/store/carts/middlewares.js",
]

function resolveMedusaDir(): string | null {
  try {
    const entry = require.resolve("@medusajs/medusa")
    let dir = dirname(entry)
    while (dir !== dirname(dir)) {
      try {
        require(join(dir, "package.json"))
        return dir
      } catch {
        dir = dirname(dir)
      }
    }
    return null
  } catch {
    return null
  }
}

export function disableMedusaRoutes(): void {
  const medusaDir = resolveMedusaDir()
  if (!medusaDir) return

  for (const file of MIDDLEWARE_FILES_TO_DISABLE) {
    defineFileConfig({
      path: join(medusaDir, file),
      isDisabled: () => true,
    })
  }
}
