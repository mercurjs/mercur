import type * as Vite from "vite"
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

export function mercurDashboardPlugin(): Vite.Plugin {
    let root: string
    let config: BuiltMercurConfig

    return {
        name: "@mercurjs/dashboard-sdk",
        configResolved(resolvedConfig) {
            root = resolvedConfig.root
        },
        async buildStart() {
            config = await loadMercurConfig(root)
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
        handleHotUpdate({ file, server }) {
            if (VALID_FILE_EXTENSIONS.includes(path.extname(file))) {
                server.restart()
            }
        },
    }
}
