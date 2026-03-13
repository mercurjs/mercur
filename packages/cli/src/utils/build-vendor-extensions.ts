import { readFileSync } from "fs";
import { builtinModules } from "node:module";
import { rm, writeFile } from "node:fs/promises";
import path from "path";
import fs from "fs";
import { generatePluginEntryModule } from "@mercurjs/dashboard-sdk";

interface BuildVendorExtensionsOptions {
  root: string;
  outDir: string;
}

export async function buildVendorExtensions(
  options: BuildVendorExtensionsOptions
): Promise<boolean> {
  const vendorDir = path.resolve(options.root, "src/vendor");

  if (!fs.existsSync(vendorDir)) {
    return true;
  }

  const vite = await import("vite");
  const react = (await import("@vitejs/plugin-react")).default;

  const pkg = JSON.parse(
    readFileSync(path.resolve(options.root, "package.json"), "utf-8")
  );
  const external = new Set([
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
    "react",
    "react/jsx-runtime",
    "react-router-dom",
    "react-i18next",
    "@medusajs/js-sdk",
    "@medusajs/admin-sdk",
    "@mercurjs/client",
    "@tanstack/react-query",
  ]);

  const outDir = path.resolve(options.outDir, "src/vendor");
  const entryFile = path.resolve(
    options.root,
    "src/vendor/__vendor-extensions__.js"
  );

  try {
    const entryCode = generatePluginEntryModule(vendorDir);
    await writeFile(entryFile, entryCode, "utf-8");

    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    await vite.build({
      build: {
        lib: {
          entry: entryFile,
          formats: ["es", "cjs"],
          fileName: "index",
        },
        emptyOutDir: false,
        minify: false,
        outDir,
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
            interop: "auto",
            chunkFileNames: () => `_chunks/[name]-[hash]`,
          },
        },
      },
      plugins: [react()],
      logLevel: "silent",
      clearScreen: false,
    });

    process.env.NODE_ENV = originalNodeEnv;

    // Rename index.es.js to index.mjs for ESM consumption
    const esFile = path.join(outDir, "index.es.js");
    const mjsFile = path.join(outDir, "index.mjs");
    if (fs.existsSync(esFile)) {
      fs.renameSync(esFile, mjsFile);
    }

    return true;
  } catch (error) {
    console.error(error);
    return false;
  } finally {
    try {
      await rm(entryFile, { force: true });
    } catch {
      // ignore
    }
  }
}
