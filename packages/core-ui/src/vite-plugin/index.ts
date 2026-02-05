import type * as Vite from "vite"
import path from "path"
import { getFileExports } from "../utils"
import { BuiltMercurConfig } from ".."
import {
    isVirtualModule,
    resolveVirtualModule,
    loadVirtualModule,
} from "./virtual-modules"

const CONFIG_NAME = "mercur.config.ts"

async function loadMercurConfig(root: string): Promise<BuiltMercurConfig> {
    const configPath = path.resolve(root, CONFIG_NAME)

    try {
        const mod = await getFileExports(configPath)
        return mod.default
    } catch (error) {
        console.error('error', error)
        throw new Error(
            `[@mercurjs/core-ui] Could not find config file "${CONFIG_NAME}" in ${root}. ` +
            `Please create a ${CONFIG_NAME} file in your project root.`
        )
    }
}

export function mercurVendorPlugin(): Vite.Plugin {
    let root: string
    let config: BuiltMercurConfig

    return {
        name: "@mercurjs/core-ui/vite-plugin",
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
            if (file.endsWith(CONFIG_NAME)) {
                server.restart()
            }
        },
    }
}