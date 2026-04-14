import path from "path"
import {
    RESOLVED_CONFIG_MODULE,
    RESOLVED_ROUTES_MODULE,
    RESOLVED_COMPONENTS_MODULE,
    RESOLVED_MENU_ITEMS_MODULE,
    RESOLVED_I18N_MODULE,
    RESOLVED_MEDUSA_ROUTES_MODULE,
    RESOLVED_MEDUSA_MENU_ITEMS_MODULE,
    RESOLVED_MEDUSA_I18N_MODULE,
    RESOLVED_MEDUSA_WIDGETS_MODULE,
    RESOLVED_MEDUSA_FORMS_MODULE,
    RESOLVED_MEDUSA_DISPLAYS_MODULE,
    RESOLVED_MEDUSA_LINKS_MODULE,
    VIRTUAL_MODULES,
} from "./constants"
import { generateRoutes } from "./routes"
import { generateMenuItems } from "./menu-items"
import { generateI18n } from "./i18n"
import type { BuiltMercurConfig } from "./types"
import { normalizePath } from "./utils"

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
        return loadRoutesModule(mercurConfig)
    }

    if (id === RESOLVED_MEDUSA_ROUTES_MODULE) {
        return loadMedusaRoutesModule(mercurConfig)
    }

    if (id === RESOLVED_MENU_ITEMS_MODULE) {
        return loadMenuItemsModule(mercurConfig)
    }

    if (id === RESOLVED_MEDUSA_MENU_ITEMS_MODULE) {
        return loadMedusaMenuItemsModule(mercurConfig)
    }

    if (id === RESOLVED_I18N_MODULE) {
        return loadI18nModule(mercurConfig)
    }

    if (id === RESOLVED_MEDUSA_I18N_MODULE) {
        return loadMedusaI18nModule(mercurConfig)
    }

    if (id === RESOLVED_MEDUSA_WIDGETS_MODULE) {
        return loadMedusaWidgetsModule(mercurConfig)
    }

    if (id === RESOLVED_MEDUSA_FORMS_MODULE) {
        return loadMedusaFormsModule(mercurConfig)
    }

    if (id === RESOLVED_MEDUSA_DISPLAYS_MODULE) {
        return loadMedusaDisplaysModule(mercurConfig)
    }

    if (id === RESOLVED_MEDUSA_LINKS_MODULE) {
        return loadMedusaLinksModule(mercurConfig)
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
        imports.push(`import _${name} from "${resolvedPath}"`)
        exports.push(`${name}: _${name}`)
    })

    return `
${imports.join('\n')}

export default {
    ${exports.join(',\n    ')}
}
`
}

function loadRoutesModule(mercurConfig: BuiltMercurConfig): string {
    return generateRoutes(mercurConfig)
}

function loadMedusaRoutesModule(mercurConfig: BuiltMercurConfig): string {
    const routesModule = generateRoutes(mercurConfig)

    return `${routesModule}

export default {
    routes: customRoutes,
}`
}

function loadMenuItemsModule(mercurConfig: BuiltMercurConfig): string {
    return generateMenuItems(mercurConfig)
}

function loadMedusaMenuItemsModule(mercurConfig: BuiltMercurConfig): string {
    return generateMenuItems(mercurConfig)
}

function loadI18nModule(mercurConfig: BuiltMercurConfig): string {
    return generateI18n(mercurConfig)
}

function loadMedusaI18nModule(mercurConfig: BuiltMercurConfig): string {
    const i18nModule = generateI18n(mercurConfig)

    return `${i18nModule}

export default {
    resources: i18nResources,
}`
}

function loadMedusaWidgetsModule(mercurConfig: BuiltMercurConfig): string {
    return generateMedusaExtensionModule(mercurConfig, "widgetModule", "widgets", "[]")
}

function loadMedusaFormsModule(mercurConfig: BuiltMercurConfig): string {
    return generateMedusaExtensionModule(
        mercurConfig,
        "formModule",
        "customFields",
        "{}"
    )
}

function loadMedusaDisplaysModule(mercurConfig: BuiltMercurConfig): string {
    return generateMedusaExtensionModule(
        mercurConfig,
        "displayModule",
        "displays",
        "{}"
    )
}

function loadMedusaLinksModule(mercurConfig: BuiltMercurConfig): string {
    return generateMedusaExtensionModule(mercurConfig, "linkModule", "links", "{}")
}

function generateMedusaExtensionModule(
    mercurConfig: BuiltMercurConfig,
    moduleKey:
        | "widgetModule"
        | "formModule"
        | "displayModule"
        | "linkModule",
    exportKey: "widgets" | "customFields" | "displays" | "links",
    fallback: "[]" | "{}"
): string {
    const pluginDeclarations = mercurConfig.pluginExtensions.map(
        (ext, index) =>
            `const __plugin${index} = (await import("${normalizePath(ext)}")).default`
    )
    const sources = mercurConfig.pluginExtensions.map(
        (_, index) => `__plugin${index}.${moduleKey}?.${exportKey}`
    )

    if (pluginDeclarations.length === 0) {
        return `export default {
    ${exportKey}: ${fallback},
}`
    }

    const aggregator =
        fallback === "[]"
            ? `[
        ${sources.join(",\n        ")}
    ].flatMap((value) => value ?? [])`
            : `Object.assign(
        {},
        ${sources.join(",\n        ")}
    )`

    return `${pluginDeclarations.join("\n")}

export default {
    ${exportKey}: ${aggregator},
}`
}
