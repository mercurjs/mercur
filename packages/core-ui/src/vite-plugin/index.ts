import type * as Vite from "vite"
import path from "path"
import { getFileExports } from "../utils"
import { MercurConfig } from ".."

const CONFIG_NAME = "mercur.config.ts"

const CONFIG_VIRTUAL_MODULE = "virtual:mercur/config"
const ROUTES_VIRTUAL_MODULE = "virtual:mercur/routes"
const COMPONENTS_VIRTUAL_MODULE = "virtual:mercur/components"

const RESOLVED_CONFIG_MODULE = "\0" + CONFIG_VIRTUAL_MODULE
const RESOLVED_ROUTES_MODULE = "\0" + ROUTES_VIRTUAL_MODULE
const RESOLVED_COMPONENTS_MODULE = "\0" + COMPONENTS_VIRTUAL_MODULE

const VIRTUAL_MODULES = [CONFIG_VIRTUAL_MODULE, ROUTES_VIRTUAL_MODULE, COMPONENTS_VIRTUAL_MODULE]

function isVirtualModule(id: string): boolean {
    return VIRTUAL_MODULES.includes(id)
}

function resolveVirtualModule(id: string): string {
    return "\0" + id
}

function loadVirtualModule({
    cwd,
    id,
    mercurConfig,
}: {
    id: string
    mercurConfig: MercurConfig
    cwd: string
}) {
    if (id === RESOLVED_CONFIG_MODULE) {
        // Export config without components (they go in separate module)
        const { components, ...configWithoutComponents } = mercurConfig
        return `export default ${JSON.stringify(configWithoutComponents)}`
    }

    if (id === RESOLVED_COMPONENTS_MODULE) {
        const components = mercurConfig.components ?? {}
        const imports: string[] = []
        const exports: string[] = []

        Object.entries(components).forEach(([name, componentPath]) => {
            const resolvedPath = path.resolve(cwd, 'src', componentPath)
            imports.push(`import { ${name} as _${name} } from "${resolvedPath}"`)
            exports.push(`${name}: _${name}`)
        })

        return `
${imports.join('\n')}

export default {
    ${exports.join(',\n    ')}
}
`
    }

    if (id === RESOLVED_ROUTES_MODULE) {
        return `export default []`
    }

    return null
}

async function loadMercurConfig(root: string): Promise<MercurConfig> {
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
    let config: MercurConfig

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