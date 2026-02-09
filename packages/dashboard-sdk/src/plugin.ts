import type * as Vite from "vite"
import fs from "fs"
import path from "path"
import { getFileExports } from "./utils"
import { CONFIG_NAME, VALID_FILE_EXTENSIONS } from "./constants"
import { isVirtualModule, resolveVirtualModule, loadVirtualModule } from "./virtual-modules"
import type { MercurConfig, BuiltMercurConfig } from "./types"

function buildConfig(config: MercurConfig, root: string): BuiltMercurConfig {
    const srcDir = path.join(root, "src")
    const configPath = path.join(root, CONFIG_NAME)

    return {
        ...config,
        root,
        srcDir,
        configPath,
    }
}

async function loadMercurConfig(root: string): Promise<BuiltMercurConfig> {
    const configPath = path.resolve(root, CONFIG_NAME)
    try {
        const mod = await getFileExports(configPath)
        return buildConfig(mod.default, root)
    } catch (error) {
        throw new Error(
            `[@mercurjs/dashboard-sdk] Could not find config file "${CONFIG_NAME}" in ${root}. ` +
            `Please create a ${CONFIG_NAME} file in your project root.`
        )
    }
}

/**
 * Resolves the core-admin pages directory from the config.
 * If corePagesDir is set in config, uses that.
 * Otherwise tries to find @mercurjs/core-admin/src/pages via node_modules.
 */
function resolveCorePagesDir(config: BuiltMercurConfig): string | null {
    if (config.corePagesDir) {
        return path.resolve(config.root, config.corePagesDir)
    }

    // Try to resolve from node_modules
    try {
        const coreAdminPkg = require.resolve("@mercurjs/core-admin/package.json", {
            paths: [config.root],
        })
        return path.join(path.dirname(coreAdminPkg), "src", "pages")
    } catch {
        return null
    }
}

/**
 * Check if user has an override page for a given core-admin page path.
 * Core-admin imports: ../../pages/products/[id]/index.tsx
 * User override: src/pages/products/[id]/index.tsx
 */
function findUserOverride(
    resolvedPath: string,
    corePagesDir: string,
    userPagesDir: string
): string | null {
    // Check if the resolved path is inside core-admin pages
    const normalizedResolved = path.normalize(resolvedPath)
    const normalizedCorePages = path.normalize(corePagesDir)

    if (!normalizedResolved.startsWith(normalizedCorePages)) {
        return null
    }

    // Get the relative path from core pages dir
    const relativePath = path.relative(normalizedCorePages, normalizedResolved)

    // Check if user has an override at the same relative path
    const userPagePath = path.join(userPagesDir, relativePath)

    // Check with various extensions
    for (const ext of VALID_FILE_EXTENSIONS) {
        // Check direct file (e.g., products.tsx)
        if (fs.existsSync(userPagePath + ext)) {
            return userPagePath + ext
        }
        // Check index file (e.g., products/index.tsx)
        const indexPath = path.join(userPagePath, `index${ext}`)
        if (fs.existsSync(indexPath)) {
            return indexPath
        }
    }

    return null
}

export function dashboardPlugin(): Vite.Plugin {
    let root: string
    let config: BuiltMercurConfig
    let corePagesDir: string | null = null
    let userPagesDir: string

    return {
        name: "@mercurjs/dashboard-sdk",
        configResolved(resolvedConfig) {
            root = resolvedConfig.root
        },
        async buildStart() {
            config = await loadMercurConfig(root)
            corePagesDir = resolveCorePagesDir(config)
            userPagesDir = path.join(root, "src", "pages")
        },
        resolveId(id, importer) {
            if (isVirtualModule(id)) {
                return resolveVirtualModule(id)
            }

            // Page override resolution
            if (corePagesDir && importer) {
                // Resolve the import relative to the importer
                if (id.startsWith(".")) {
                    const importerDir = path.dirname(importer)
                    const resolvedPath = path.resolve(importerDir, id)

                    const userOverride = findUserOverride(
                        resolvedPath,
                        corePagesDir,
                        userPagesDir
                    )

                    if (userOverride) {
                        return userOverride
                    }
                }
            }

            return null
        },
        load(id) {
            return loadVirtualModule({ cwd: root, id, mercurConfig: config })
        },
        handleHotUpdate({ file, server }) {
            if (VALID_FILE_EXTENSIONS.includes(path.extname(file))) {
                server.restart()
            }
        },
    }
}
