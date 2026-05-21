const { readFileSync, writeFileSync } = require("fs")
const { dirname, join } = require("path")

/**
 * Strips Medusa's default `POST /store/carts/:id/line-items` middleware
 * entry so Mercur's offer_id-aware validator (registered in
 * packages/core/src/api/store/carts/middlewares.ts) is the only one
 * that runs. Medusa's `StoreAddCartLineItem` validator is `.strict()`
 * and requires `variant_id`, which rejects the `offer_id` payload
 * before Mercur's route handler is reached.
 *
 * Mirrors `packages/cli/src/utils/patch-medusa.ts::patchStoreCartLineItemsMiddleware`,
 * inlined here so the patch fires regardless of whether `mercurjs build`
 * has been invoked. The Jest globalSetup runs this exactly once before
 * the test suites boot.
 */
module.exports = async function globalSetup() {
  try {
    const medusaPkgJson = require.resolve("@medusajs/medusa/package.json")
    const medusaDir = dirname(medusaPkgJson)

    patchStoreCartLineItemsMiddleware(medusaDir)
    patchStoreCartLineItemsRoute(medusaDir)
  } catch (err) {
    // Surface but do not throw — partial patch state is still safer
    // than blowing up the entire test run before the first suite loads.
    // eslint-disable-next-line no-console
    console.warn(
      `[integration-tests] globalSetup patch-medusa failed: ${err}`,
    )
  }
}

function patchStoreCartLineItemsMiddleware(medusaDir) {
  const filePath = join(
    medusaDir,
    "dist/api/store/carts/middlewares.js",
  )

  let content
  try {
    content = readFileSync(filePath, "utf-8")
  } catch {
    return
  }

  const pattern =
    /\s*\{\s*method:\s*\["POST"\],\s*matcher:\s*"\/store\/carts\/:id\/line-items",\s*middlewares:\s*\[[^\]]*\],?\s*\},?/

  const before = content
  content = content.replace(pattern, "")

  if (content !== before) {
    writeFileSync(filePath, content)
  }
}

/**
 * Blank Medusa's compiled POST /store/carts/:id/line-items handler.
 * Mercur owns the route at the loader layer so this is belt-and-braces:
 * if Mercur's loader ever drifts, Medusa's handler would dispatch
 * addToCartWorkflow without the offer-aware validator above it.
 */
function patchStoreCartLineItemsRoute(medusaDir) {
  const filePath = join(
    medusaDir,
    "dist/api/store/carts/[id]/line-items/route.js",
  )

  let content
  try {
    content = readFileSync(filePath, "utf-8")
  } catch {
    return
  }

  if (content.includes("// mercur: blanked")) {
    return
  }

  const blanked = [
    `"use strict";`,
    `// mercur: blanked — POST /store/carts/:id/line-items is owned by`,
    `// packages/core/src/api/store/carts/[id]/line-items/route.ts.`,
    `Object.defineProperty(exports, "__esModule", { value: true });`,
    ``,
  ].join("\n")

  writeFileSync(filePath, blanked)
}
