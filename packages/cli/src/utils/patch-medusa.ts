import { createRequire } from "module";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import resolveCwd from "resolve-cwd";
import { packageDirectory } from "pkg-dir";
import { logger } from "@/src/utils/logger";

export async function patchMedusa() {
  try {
    const resolved = resolveCwd("@medusajs/medusa");
    const medusaDir = await packageDirectory({ cwd: resolved });

    if (!medusaDir) {
      logger.warn("Could not find @medusajs/medusa package directory, skipping patches.");
      return;
    }

    // Surgically strip Medusa's POST /store/carts/:id/line-items middleware
    // entry so Mercur's offer_id-based validator (registered in
    // packages/core/src/api/store/carts/middlewares.ts) is the only one
    // that runs. Medusa's StoreAddCartLineItem validator is .strict() and
    // requires variant_id, which rejects Mercur's offer_id payload.
    patchStoreCartLineItemsMiddleware(medusaDir);

    // Belt-and-braces: blank Medusa's compiled handler at the same path.
    // Mercur owns POST /store/carts/:id/line-items at the loader layer,
    // so Medusa's handler should never fire — but if the loader order ever
    // drifts, the upstream handler would dispatch addToCartWorkflow without
    // the offer_id payload validator and we'd snapshot pre-offer prices.
    patchStoreCartLineItemsRoute(medusaDir);

    // Remove product from SERVICES_INTERFACES so the generated
    // modules-bindings.d.ts uses the actual module service type
    await patchContainerTypes();
  } catch (err) {
    logger.error(`Failed to patch Medusa: ${err}`);
  }
}

function patchStoreCartLineItemsRoute(medusaDir: string) {
  const filePath = join(medusaDir, "dist/api/store/carts/[id]/line-items/route.js");
  let content: string;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch {
    return;
  }

  // Idempotency marker. Skip if already blanked.
  if (content.includes("// mercur: blanked")) {
    return;
  }

  const blanked = [
    `"use strict";`,
    `// mercur: blanked — POST /store/carts/:id/line-items is owned by`,
    `// packages/core/src/api/store/carts/[id]/line-items/route.ts.`,
    `Object.defineProperty(exports, "__esModule", { value: true });`,
    ``,
  ].join("\n");

  writeFileSync(filePath, blanked);
}

function patchStoreCartLineItemsMiddleware(medusaDir: string) {
  const filePath = join(medusaDir, "dist/api/store/carts/middlewares.js");
  let content: string;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch {
    return;
  }

  const before = content;
  // Match the literal POST /store/carts/:id/line-items entry (NOT the
  // sibling /store/carts/:id/line-items/:line_id entry). The Medusa
  // build output is stable around the matcher string and the trailing
  // comma after the closing brace.
  const pattern =
    /\s*\{\s*method:\s*\["POST"\],\s*matcher:\s*"\/store\/carts\/:id\/line-items",\s*middlewares:\s*\[[^\]]*\],?\s*\},?/;
  content = content.replace(pattern, "");

  if (content !== before) {
    writeFileSync(filePath, content);
  }
}

/**
 * Remove product from SERVICES_INTERFACES in @medusajs/utils so the
 * generated modules-bindings.d.ts derives the type from Mercur's
 * custom product module service instead of IProductModuleService.
 */
async function patchContainerTypes() {
  try {
    const medusaUtils = resolveCwd("@medusajs/medusa/utils");
    const require_ = createRequire(medusaUtils);
    const utilsEntry = require_.resolve("@medusajs/utils");
    const utilsDir = await packageDirectory({ cwd: dirname(utilsEntry) });

    if (!utilsDir) {
      return;
    }

    const filePath = join(utilsDir, "dist/modules-sdk/modules-to-container-types.js");
    let content = readFileSync(filePath, "utf-8");

    content = content.replace(
      /\s*\[definition_1\.Modules\.PRODUCT\]:\s*"IProductModuleService",?\n?/g,
      "\n"
    );

    writeFileSync(filePath, content);
  } catch (err) {
    logger.error(`Failed to patch container types: ${err}`);
  }
}
