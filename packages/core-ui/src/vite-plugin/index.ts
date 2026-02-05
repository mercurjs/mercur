import type * as Vite from "vite"
import path from "path"
import { pathToFileURL } from "url"

export interface MercurConfig {
    title: string
    description: string
}

const CONFIG_NAME = "mercur.config.ts"

const CONFIG_VIRTUAL_MODULE = "virtual:mercur/config"
const ROUTES_VIRTUAL_MODULE = "virtual:mercur/routes"

const RESOLVED_CONFIG_MODULE = "\0" + CONFIG_VIRTUAL_MODULE
const RESOLVED_ROUTES_MODULE = "\0" + ROUTES_VIRTUAL_MODULE

const VIRTUAL_MODULES = [CONFIG_VIRTUAL_MODULE, ROUTES_VIRTUAL_MODULE]

function isVirtualModule(id: string): boolean {
    return VIRTUAL_MODULES.includes(id)
}

function resolveVirtualModule(id: string): string {
    return "\0" + id
}

function loadVirtualModule(id: string, mercurConfig: MercurConfig) {
    if (id === RESOLVED_CONFIG_MODULE) {
        return `export default ${JSON.stringify(mercurConfig)}`
    }

    if (id === RESOLVED_ROUTES_MODULE) {
        return `export default []`
    }

    return null
}

async function loadMercurConfig(root: string): Promise<MercurConfig> {
    const configPath = path.resolve(root, CONFIG_NAME)

    try {
        const configUrl = pathToFileURL(configPath).href
        const mod = await import(configUrl)
        return mod.default ?? mod
    } catch (error) {
        throw new Error(
            `[@mercurjs/core-ui] Could not find config file "${CONFIG_NAME}" in ${root}. ` +
            `Please create a ${CONFIG_NAME} file in your project root.`
        )
    }
}

export function mercurVendorPlugin(): Vite.Plugin {
    let root: string
    let config: MercurConfig

    return {
        name: "@mercurjs/core-ui/vite-plugin",
        configResolved(config) {
            root = config.root
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
            return loadVirtualModule(id, config)
        },
        handleHotUpdate({ file, server }) {
            if (file.endsWith(CONFIG_NAME)) {
                server.restart()
            }
        },
    }
}