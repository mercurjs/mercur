import { readFileSync } from "fs";
import { builtinModules } from "node:module";
import { rm, writeFile } from "node:fs/promises";
import path from "path";
import fs from "fs";
import { generatePluginEntryModule } from "@mercurjs/dashboard-sdk/vite";

const VALID_FILE_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"];

export type DashboardApp = "admin" | "vendor";

export interface BuildDashboardExtensionsOptions {
  /** Package root — its `package.json` seeds the external list. */
  root: string;
  /** Directory holding `routes/`, `widgets/`, `custom-fields/`, `i18n/`. */
  srcDir: string;
  /** Where to write the bundled ESM entry. */
  outFile: string;
  /** Extra bare specifiers to keep external (e.g. host-provided peers). */
  extraExternal?: string[];
  watch?: boolean;
}

/**
 * An authored `index.*` in `srcDir` replaces the crawled entry, so a package can
 * hand-write what it contributes — including re-exporting an entry another
 * package already built — instead of having it derived from its folder tree.
 */
function findAuthoredEntry(srcDir: string): string | null {
  for (const ext of VALID_FILE_EXTENSIONS) {
    const candidate = path.join(srcDir, `index${ext}`);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function readExternalNames(root: string, extra: string[]): Set<string> {
  let pkg: Record<string, Record<string, string> | undefined> = {};
  try {
    pkg = JSON.parse(readFileSync(path.resolve(root, "package.json"), "utf-8"));
  } catch {
    // A package.json is not required — the defaults below still apply.
  }

  return new Set([
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
    "react",
    "react/jsx-runtime",
    "react-dom",
    "react-router-dom",
    "react-i18next",
    "i18next",
    "@medusajs/js-sdk",
    "@medusajs/admin-sdk",
    "@medusajs/ui",
    "@medusajs/icons",
    "@mercurjs/client",
    "@mercurjs/dashboard-shared",
    "@tanstack/react-query",
    ...extra,
  ]);
}

/**
 * Bundle a dashboard surface (`src/admin` or `src/vendor`) into the single ESM
 * entry the Vite plugin loads. Works for a Medusa plugin and for a standalone
 * package that ships its own prebuilt entry.
 *
 * Returns `true` when there is nothing to build, so callers can run it
 * unconditionally for both surfaces.
 */
export async function buildDashboardExtensions(
  options: BuildDashboardExtensionsOptions
): Promise<boolean> {
  const srcDir = path.resolve(options.root, options.srcDir);

  if (!fs.existsSync(srcDir)) {
    return true;
  }

  const vite = await import("vite");
  const react = (await import("@vitejs/plugin-react")).default;

  const external = readExternalNames(options.root, options.extraExternal ?? []);

  const outFile = path.resolve(options.root, options.outFile);
  const outDir = path.dirname(outFile);
  const fileName = path.basename(outFile, path.extname(outFile));

  const authoredEntry = findAuthoredEntry(srcDir);
  const generatedEntry = path.join(srcDir, "__dashboard-extensions__.js");
  const entryFile = authoredEntry ?? generatedEntry;

  try {
    if (!authoredEntry) {
      await writeFile(
        generatedEntry,
        generatePluginEntryModule(srcDir),
        "utf-8"
      );
    }

    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    await vite.build({
      build: {
        lib: {
          entry: entryFile,
          formats: ["es", "cjs"],
          fileName,
        },
        emptyOutDir: false,
        minify: false,
        outDir,
        watch: options.watch ? {} : undefined,
        rollupOptions: {
          external: (id, importer) => {
            const idParts = id.split("/");
            const name = idParts[0]?.startsWith("@")
              ? `${idParts[0]}/${idParts[1]}`
              : idParts[0];

            const builtinModulesWithNodePrefix = [
              ...builtinModules,
              ...builtinModules.map((modName) => `node:${modName}`),
            ];

            if (!importer) {
              return Boolean(
                (name && external.has(name)) ||
                  (name && builtinModulesWithNodePrefix.includes(name))
              );
            }

            return Boolean(name && external.has(name));
          },
          output: {
            preserveModules: false,
            chunkFileNames: () => `_chunks/[name]-[hash]`,
          },
        },
      },
      plugins: [react()],
      logLevel: "silent",
      clearScreen: false,
    });

    process.env.NODE_ENV = originalNodeEnv;

    // The Vite plugin resolves this entry as ESM by extension, so `.es.js` has
    // to become `.mjs` regardless of what the caller named the output.
    const esFile = path.join(outDir, `${fileName}.es.js`);
    const mjsFile = path.join(outDir, `${fileName}.mjs`);
    if (fs.existsSync(esFile)) {
      fs.renameSync(esFile, mjsFile);
    }

    return true;
  } catch (error) {
    console.error(error);
    return false;
  } finally {
    if (!authoredEntry) {
      try {
        await rm(generatedEntry, { force: true });
      } catch {
        // ignore
      }
    }
  }
}
