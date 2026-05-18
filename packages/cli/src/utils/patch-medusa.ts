import { createRequire } from "module";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import fg from "fast-glob";
import resolveCwd from "resolve-cwd";
import { packageDirectory } from "pkg-dir";
import { logger } from "@/src/utils/logger";

/**
 * Middleware files within @medusajs/medusa that Mercur overrides.
 * Each entry maps a file path to the named export that must remain
 * as an empty array so the parent aggregator can still spread it.
 */
const MIDDLEWARES_TO_DISABLE: Record<string, string> = {
  "dist/api/admin/products/middlewares.js": "adminProductRoutesMiddlewares",
  "dist/api/admin/product-variants/middlewares.js": "adminProductVariantRoutesMiddlewares",
  "dist/api/admin/product-categories/middlewares.js": "adminProductCategoryRoutesMiddlewares",
  "dist/api/store/products/middlewares.js": "storeProductRoutesMiddlewares",
  "dist/api/store/product-categories/middlewares.js": "storeProductCategoryRoutesMiddlewares",
  "dist/api/store/product-variants/middlewares.js": "storeProductVariantRoutesMiddlewares",
};

/**
 * Route directories within @medusajs/medusa to disable.
 * All route.js files under these globs get patched with
 * defineFileConfig({ isDisabled: () => true }).
 */
const ROUTE_GLOBS_TO_DISABLE = [
  "dist/api/admin/products/**/route.js",
  "dist/api/admin/product-variants/**/route.js",
  "dist/api/admin/product-categories/**/route.js",
  "dist/api/store/products/**/route.js",
  "dist/api/store/product-categories/**/route.js",
  "dist/api/store/product-variants/**/route.js",
];

const DISABLED_ROUTE_CONTENT = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
`;

function buildDisabledMiddlewareContent(exportName: string) {
  return `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.${exportName} = void 0;
exports.${exportName} = [];
`;
}

export async function patchMedusa() {
  try {
    const resolved = resolveCwd("@medusajs/medusa");
    const medusaDir = await packageDirectory({ cwd: resolved });

    if (!medusaDir) {
      logger.warn("Could not find @medusajs/medusa package directory, skipping patches.");
      return;
    }

    // Patch middleware files (export empty arrays)
    for (const [file, exportName] of Object.entries(MIDDLEWARES_TO_DISABLE)) {
      const filePath = join(medusaDir, file);
      writeFileSync(filePath, buildDisabledMiddlewareContent(exportName));
    }

    // Patch route files (defineFileConfig isDisabled)
    for (const glob of ROUTE_GLOBS_TO_DISABLE) {
      const routeFiles = await fg(glob, { cwd: medusaDir, absolute: true });
      for (const routeFile of routeFiles) {
        writeFileSync(routeFile, DISABLED_ROUTE_CONTENT);
      }
    }

    // Remove product from SERVICES_INTERFACES so the generated
    // modules-bindings.d.ts uses the actual module service type
    await patchContainerTypes();
  } catch (err) {
    logger.error(`Failed to patch Medusa: ${err}`);
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

