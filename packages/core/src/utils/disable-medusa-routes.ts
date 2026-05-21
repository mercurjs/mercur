import { readdirSync } from "fs"
import { dirname, join, resolve } from "path"
import { defineFileConfig } from "@medusajs/framework/utils"

const MIDDLEWARE_FILES_TO_DISABLE = [
  "dist/api/admin/products/middlewares.js",
  "dist/api/admin/product-variants/middlewares.js",
  "dist/api/admin/product-categories/middlewares.js",
  "dist/api/store/products/middlewares.js",
  "dist/api/store/product-categories/middlewares.js",
  "dist/api/store/product-variants/middlewares.js",
]

const ROUTE_DIRS_TO_DISABLE = [
  "dist/api/admin/products",
  "dist/api/admin/product-variants",
  "dist/api/admin/product-categories",
  "dist/api/store/products",
  "dist/api/store/product-categories",
  "dist/api/store/product-variants",
]

function resolveMedusaDir(): string | null {
  try {
    // require.resolve returns the entry file; walk to the package root.
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

function walkRouteFiles(dir: string): string[] {
  let entries: { name: string; isDirectory: () => boolean }[]
  try {
    entries = readdirSync(dir, { recursive: true, withFileTypes: true }) as any
  } catch {
    return []
  }
  const out: string[] = []
  for (const entry of entries) {
    if (entry.isDirectory()) continue
    if (entry.name !== "route.js") continue
    const parent = (entry as any).parentPath ?? (entry as any).path ?? dir
    out.push(resolve(parent, entry.name))
  }
  return out
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

  for (const rel of ROUTE_DIRS_TO_DISABLE) {
    for (const file of walkRouteFiles(join(medusaDir, rel))) {
      defineFileConfig({ path: file, isDisabled: () => true })
    }
  }
}
