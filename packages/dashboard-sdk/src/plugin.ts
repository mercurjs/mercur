import type * as Vite from "vite"
import path from "path"
import { getFileExports } from "./utils"
import { RESOLVED_ROUTES_MODULE } from "./constants"
import { isVirtualModule, resolveVirtualModule, loadVirtualModule } from "./virtual-modules"
import type { MercurConfig, BuiltMercurConfig } from "./types"

function isPageFile(file: string): boolean {
    const basename = path.basename(file, path.extname(file))
    return basename === "page"
}

const UI_MODULE_KEYS = [
    "admin_ui",
    "vendor_ui",
]

async function loadMedusaConfig(medusaConfigPath: string, root: string): Promise<{ base?: string }> {
    try {
        const mod = await getFileExports(medusaConfigPath)
        const medusaConfig = mod.default ?? mod

        const modules = medusaConfig?.modules ?? {}

        for (const key of UI_MODULE_KEYS) {
            const value = modules[key]
            if (!value || typeof value !== "object" || !value.options?.appDir) continue

            const appDir = path.resolve(path.dirname(medusaConfigPath), value.options.appDir)

            if (appDir === root) {
                return {
                    base: value.options.path,
                }
            }
        }

        return {}
    } catch {
        return {}
    }
}

export function mercurDashboardPlugin(pluginConfig: MercurConfig): Vite.Plugin {
    let root: string
    let config: BuiltMercurConfig

    return {
        name: "@mercurjs/dashboard-sdk",
        async config(viteConfig) {
            root = viteConfig.root || process.cwd()

            const medusaConfigPath = path.resolve(root, pluginConfig.medusaConfigPath)
            const { base } = await loadMedusaConfig(medusaConfigPath, root)

            const srcDir = path.join(root, "src")
            const backendUrl = pluginConfig.backendUrl ?? "http://localhost:9000"

            config = {
                ...pluginConfig,
                backendUrl,
                base,
                root,
                srcDir,
            }

            return {
                base: config.base,
                define: {
                    "__BACKEND_URL__": JSON.stringify(config.backendUrl),
                    "__BASE__": JSON.stringify(config.base || "/"),
                },
                optimizeDeps: {
                    exclude: ['virtual:mercur/config', 'virtual:mercur/routes', 'virtual:mercur/components', 'virtual:mercur/menu-items', 'virtual:mercur/i18n']
                },
            }
        },
        configResolved(resolvedConfig) {
            root = resolvedConfig.root
        },
        resolveId(id) {
            if (isVirtualModule(id)) {
                return resolveVirtualModule(id)
            }
            return null
        },
        load(id) {
            return loadVirtualModule({ cwd: root, id, mercurConfig: config })
        },
        configureServer(server) {
            const handlePageChange = (file: string) => {
                if (!isPageFile(file)) return

                const mod = server.moduleGraph.getModuleById(RESOLVED_ROUTES_MODULE)
                if (mod) {
                    server.moduleGraph.invalidateModule(mod)
                    server.ws.send({ type: "full-reload" })
                }
            }

            server.watcher.on("add", handlePageChange)
            server.watcher.on("unlink", handlePageChange)
        },
        handleHotUpdate({ file, server }) {
            if (isPageFile(file)) {
                const mod = server.moduleGraph.getModuleById(RESOLVED_ROUTES_MODULE)
                if (mod) {
                    server.moduleGraph.invalidateModule(mod)
                }
            }
        },
    }
}
