import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";
import { writeFile } from "fs/promises";

import { ROUTE_FILE_PATTERN } from "../src/codegen/constants";
import { recursiveReadDir } from "../src/codegen/fs";
import { normalizeApiPath, normalizePathSep } from "../src/codegen/path";
import { getRoutes } from "../src/codegen/routes";

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));

const cliRoot = path.resolve(here, "..");
const repoRoot = path.resolve(cliRoot, "..", "..");
const coreRoot = path.join(repoRoot, "packages", "core");
const coreApiDir = path.join(coreRoot, "src", "api");
const outFile = path.join(cliRoot, "routes-manifest.json");

function importType(specifier: string): string {
    return `typeof import("${specifier}")`;
}

async function collectMedusaRoutes(): Promise<Record<string, string>> {
    // @medusajs/medusa is a dependency of @mercurjs/core / apps/api, not the CLI,
    // so resolve it from those package roots.
    const medusaPkg = require.resolve("@medusajs/medusa/package.json", {
        paths: [coreRoot, path.join(repoRoot, "apps", "api"), repoRoot],
    });
    const medusaDir = path.dirname(medusaPkg);
    const apiDir = path.join(medusaDir, "dist", "api");

    const files = await recursiveReadDir(apiDir, {
        pathnameFilter: (pathname) => ROUTE_FILE_PATTERN.test(pathname),
        ignorePartFilter: (part) => part.startsWith("_") || part === "node_modules",
    });

    const routes: Record<string, string> = {};
    for (const filePath of files) {
        const relative = normalizePathSep(path.relative(apiDir, filePath));
        const specifier = `@medusajs/medusa/api/${relative.replace(/\.js$/, "")}`;
        routes[normalizeApiPath(relative)] = importType(specifier);
    }
    return routes;
}

async function collectCoreRoutes(): Promise<Record<string, string>> {
    const routes: Record<string, string> = {};
    for (const { filePath, route } of await getRoutes(coreApiDir)) {
        const specifier = `@mercurjs/core/api/${filePath.replace(/\.ts$/, "")}`;
        routes[route] = importType(specifier);
    }
    return routes;
}

async function main() {
    const medusaRoutes = await collectMedusaRoutes();
    const coreRoutes = await collectCoreRoutes();

    // Core overrides Medusa on identical paths, matching codegen merge precedence.
    const merged = { ...medusaRoutes, ...coreRoutes };
    const sorted = Object.fromEntries(
        Object.entries(merged).sort(([a], [b]) => a.localeCompare(b))
    );

    await writeFile(outFile, JSON.stringify(sorted, null, 2) + "\n", "utf-8");

    console.log(
        `Wrote ${Object.keys(sorted).length} routes ` +
            `(${Object.keys(medusaRoutes).length} medusa, ${Object.keys(coreRoutes).length} core) ` +
            `to ${path.relative(repoRoot, outFile)}`
    );
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
