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
    "@mercurjs/core-plugin/modules/admin-ui",
    "@mercurjs/core-plugin/modules/vendor-ui",
]

async function loadMedusaConfig(medusaConfigPath: string, root: string): Promise<{ backendUrl: string; base?: string }> {
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
                    backendUrl: value.options.backendUrl ?? "http://localhost:9000",
                    base: value.options.path,
                }
            }
        }

        return { backendUrl: "http://localhost:9000" }
    } catch {
        return { backendUrl: "http://localhost:9000" }
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
            const { backendUrl, base } = await loadMedusaConfig(medusaConfigPath, root)

            const srcDir = path.join(root, "src")

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
