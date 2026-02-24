import type * as Vite from "vite"
import path from "path"
import { getFileExports } from "./utils"
import { CONFIG_NAME, RESOLVED_ROUTES_MODULE } from "./constants"
import { isVirtualModule, resolveVirtualModule, loadVirtualModule } from "./virtual-modules"
import type { MercurConfig, BuiltMercurConfig } from "./types"

function buildConfig(config: MercurConfig, root: string): BuiltMercurConfig {
    const srcDir = path.join(root, "src")

    return {
        ...config,
        backendUrl: config.backendUrl ?? "http://localhost:9000",
        root,
        srcDir,
        configPath: path.resolve(root, CONFIG_NAME),
    }
}

async function loadMercurConfig(root: string): Promise<BuiltMercurConfig> {
    const configPath = path.resolve(root, CONFIG_NAME)
    try {
        const mod = await getFileExports(configPath)
        const content = mod.default ?? mod
        return buildConfig(content, root)
    } catch (error) {
        console.error(error)
        throw new Error(
            `[@mercurjs/dashboard-sdk] Could not find or load ${CONFIG_NAME} in ${root}`
        )
    }
}

function isPageFile(file: string): boolean {
    const basename = path.basename(file, path.extname(file))
    return basename === "page"
}

export function dashboardPlugin(): Vite.Plugin {
    let root: string
    let config: BuiltMercurConfig

    return {
        name: "@mercurjs/dashboard-sdk",
        async config(viteConfig) {
            root = viteConfig.root || process.cwd()
            config = await loadMercurConfig(root)
            return {
                define: {
                    "__BACKEND_URL__": JSON.stringify(config.backendUrl),
                }
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
            const configPath = path.resolve(root, CONFIG_NAME)

            if (file === configPath) {
                server.restart()
                return
            }

            if (isPageFile(file)) {
                const mod = server.moduleGraph.getModuleById(RESOLVED_ROUTES_MODULE)
                if (mod) {
                    server.moduleGraph.invalidateModule(mod)
                }
            }
        },
    }
}
