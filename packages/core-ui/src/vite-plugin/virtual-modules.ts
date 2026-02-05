import path from "path"
import { BuiltMercurConfig } from ".."

export const CONFIG_VIRTUAL_MODULE = "virtual:mercur/config"
export const ROUTES_VIRTUAL_MODULE = "virtual:mercur/routes"
export const COMPONENTS_VIRTUAL_MODULE = "virtual:mercur/components"

export const RESOLVED_CONFIG_MODULE = "\0" + CONFIG_VIRTUAL_MODULE
export const RESOLVED_ROUTES_MODULE = "\0" + ROUTES_VIRTUAL_MODULE
export const RESOLVED_COMPONENTS_MODULE = "\0" + COMPONENTS_VIRTUAL_MODULE

export const VIRTUAL_MODULES = [
    CONFIG_VIRTUAL_MODULE,
    ROUTES_VIRTUAL_MODULE,
    COMPONENTS_VIRTUAL_MODULE,
]

export function isVirtualModule(id: string): boolean {
    return VIRTUAL_MODULES.includes(id)
}

export function resolveVirtualModule(id: string): string {
    return "\0" + id
}

export interface LoadVirtualModuleOptions {
    id: string
    mercurConfig: BuiltMercurConfig
    cwd: string
}

export function loadVirtualModule({
    cwd,
    id,
    mercurConfig,
}: LoadVirtualModuleOptions): string | null {
    if (id === RESOLVED_CONFIG_MODULE) {
        return loadConfigModule(mercurConfig)
    }

    if (id === RESOLVED_COMPONENTS_MODULE) {
        return loadComponentsModule(mercurConfig, cwd)
    }

    if (id === RESOLVED_ROUTES_MODULE) {
        return loadRoutesModule()
    }

    return null
}

function loadConfigModule(mercurConfig: BuiltMercurConfig): string {
    const { components, ...configWithoutComponents } = mercurConfig
    return `export default ${JSON.stringify(configWithoutComponents)}`
}

function loadComponentsModule(mercurConfig: BuiltMercurConfig, cwd: string): string {
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

function loadRoutesModule(): string {
    return `export default []`
}
