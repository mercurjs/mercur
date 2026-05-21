import { join } from "path";
import fg from "fast-glob";
import resolveCwd from "resolve-cwd";
import { packageDirectory } from "pkg-dir";
import { defineFileConfig } from "@medusajs/framework/utils";
import { logger } from "@/src/utils/logger";

const MIDDLEWARE_FILES_TO_DISABLE = [
  "dist/api/admin/products/middlewares.js",
  "dist/api/admin/product-variants/middlewares.js",
  "dist/api/admin/product-categories/middlewares.js",
  "dist/api/store/products/middlewares.js",
  "dist/api/store/product-categories/middlewares.js",
  "dist/api/store/product-variants/middlewares.js",
];

const ROUTE_GLOBS_TO_DISABLE = [
  "dist/api/admin/products/**/route.js",
  "dist/api/admin/product-variants/**/route.js",
  "dist/api/admin/product-categories/**/route.js",
  "dist/api/store/products/**/route.js",
  "dist/api/store/product-categories/**/route.js",
  "dist/api/store/product-variants/**/route.js",
];

export async function preflightDisableMedusaRoutes() {
  try {
    const resolved = resolveCwd("@medusajs/medusa");
    const medusaDir = await packageDirectory({ cwd: resolved });

    if (!medusaDir) {
      logger.warn(
        "Could not find @medusajs/medusa package directory, skipping route disabling."
      );
      return;
    }

    for (const file of MIDDLEWARE_FILES_TO_DISABLE) {
      defineFileConfig({
        path: join(medusaDir, file),
        isDisabled: () => true,
      });
    }

    for (const glob of ROUTE_GLOBS_TO_DISABLE) {
      const routeFiles = await fg(glob, { cwd: medusaDir, absolute: true });
      for (const routeFile of routeFiles) {
        defineFileConfig({
          path: routeFile,
          isDisabled: () => true,
        });
      }
    }
  } catch (err) {
    logger.error(`Failed to disable Medusa routes: ${err}`);
  }
}
