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
];

const DISABLED_ROUTE_CONTENT = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@medusajs/framework/utils");
(0, utils_1.defineFileConfig)({
  isDisabled: () => true,
});
`;

function buildDisabledMiddlewareContent(exportName: string) {
  return `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.${exportName} = void 0;
exports.${exportName} = [];
`;
}

/**
 * Product link definition lines to strip from @medusajs/link-modules
 * definitions/index.js so Mercur's own product links take precedence.
 */
const PRODUCT_LINK_PATTERNS = [
  /.*require\("\.\/product-.*"\).*\n?/g,
];

/**
 * Glob pattern for product files within @medusajs/core-flows.
 * Mercur replaces the entire product module, so all of Medusa's
 * built-in product workflows, steps, and helpers must be disabled.
 */
const CORE_FLOW_PRODUCT_GLOBS = [
  "dist/product/**/*.js",
  "dist/product-category/**/*.js",
];

const STUBBED_MODULE_CONTENT = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
`;

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

    // Strip product link definitions from @medusajs/link-modules
    await patchLinkModules();

    // Remove product from SERVICES_INTERFACES so the generated
    // modules-bindings.d.ts uses the actual module service type
    await patchContainerTypes();

    // Stub out Medusa's built-in product workflows from @medusajs/core-flows
    await patchCoreFlows();
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

async function patchCoreFlows() {
  try {
    // Follow the same resolution chain the runtime uses, via @medusajs/medusa
    const medusaCoreFlows = resolveCwd("@medusajs/medusa/core-flows");
    const require_ = createRequire(medusaCoreFlows);
    const coreFlowsEntry = require_.resolve("@medusajs/core-flows");
    const coreFlowsDir = await packageDirectory({ cwd: dirname(coreFlowsEntry) });

    if (!coreFlowsDir) {
      return;
    }

    for (const glob of CORE_FLOW_PRODUCT_GLOBS) {
      const files = await fg(glob, { cwd: coreFlowsDir, absolute: true });
      for (const file of files) {
        writeFileSync(file, STUBBED_MODULE_CONTENT);
      }
    }
  } catch (err) {
    logger.error(`Failed to patch core-flows: ${err}`);
  }
}

async function patchLinkModules() {
  try {
    // The runtime resolves @medusajs/link-modules via the discoveryPath
    // in @medusajs/medusa/link-modules, which may point to a different
    // copy than what resolveCwd finds (e.g. bun's .bun/ cache).
    // We follow the same resolution chain the runtime uses.
    const medusaLinkModules = resolveCwd("@medusajs/medusa/link-modules");
    const require_ = createRequire(medusaLinkModules);
    const linkModulesEntry = require_.resolve("@medusajs/link-modules");
    const linkModulesDir = await packageDirectory({ cwd: dirname(linkModulesEntry) });

    if (!linkModulesDir) {
      return;
    }

    const indexPath = join(linkModulesDir, "dist/definitions/index.js");
    let content = readFileSync(indexPath, "utf-8");

    for (const pattern of PRODUCT_LINK_PATTERNS) {
      content = content.replace(pattern, "");
    }

    writeFileSync(indexPath, content);
  } catch (err) {
    logger.error(`Failed to patch link-modules: ${err}`);
  }
}
