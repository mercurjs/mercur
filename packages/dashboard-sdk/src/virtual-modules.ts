import {
    RESOLVED_CONFIG_MODULE,
    RESOLVED_ROUTES_MODULE,
    RESOLVED_MENU_ITEMS_MODULE,
    RESOLVED_I18N_MODULE,
    RESOLVED_WIDGETS_MODULE,
    RESOLVED_NAVIGATION_MODULE,
    RESOLVED_CUSTOM_FIELDS_MODULE,
    VIRTUAL_MODULES,
} from "./constants"
import { generateRoutes } from "./routes"
import { generateMenuItems } from "./menu-items"
import { generateI18n } from "./i18n"
import { generateWidgets } from "./widgets"
import { generateNavigation } from "./navigation"
import { generateCustomFields } from "./custom-fields"
import type { BuiltMercurConfig } from "./types"

export function isVirtualModule(id: string): boolean {
    return VIRTUAL_MODULES.includes(id)
}

export function resolveVirtualModule(id: string): string {
    return "\0" + id
}

export interface LoadVirtualModuleOptions {
    id: string
    mercurConfig: BuiltMercurConfig
}

export function loadVirtualModule({
    id,
    mercurConfig,
}: LoadVirtualModuleOptions): string | null {
    if (id === RESOLVED_CONFIG_MODULE) {
        return loadConfigModule(mercurConfig)
    }

    if (id === RESOLVED_ROUTES_MODULE) {
        return loadRoutesModule(mercurConfig)
    }

    if (id === RESOLVED_MENU_ITEMS_MODULE) {
        return loadMenuItemsModule(mercurConfig)
    }

    if (id === RESOLVED_I18N_MODULE) {
        return loadI18nModule(mercurConfig)
    }

    if (id === RESOLVED_WIDGETS_MODULE) {
        return generateWidgets(mercurConfig)
    }

    if (id === RESOLVED_NAVIGATION_MODULE) {
        return generateNavigation(mercurConfig)
    }

    if (id === RESOLVED_CUSTOM_FIELDS_MODULE) {
        return generateCustomFields(mercurConfig)
    }

    return null
}

function loadConfigModule(mercurConfig: BuiltMercurConfig): string {
    return `export default ${JSON.stringify(mercurConfig)}`
}

function loadRoutesModule(mercurConfig: BuiltMercurConfig): string {
    return generateRoutes(mercurConfig)
}

function loadMenuItemsModule(mercurConfig: BuiltMercurConfig): string {
    return generateMenuItems(mercurConfig)
}

function loadI18nModule(mercurConfig: BuiltMercurConfig): string {
    return generateI18n(mercurConfig)
}
