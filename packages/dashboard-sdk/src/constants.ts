export const VALID_FILE_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"]
export const CONFIG_NAME = "mercur.config.ts"

export const CONFIG_VIRTUAL_MODULE = "virtual:mercur/config"
export const ROUTES_VIRTUAL_MODULE = "virtual:mercur/routes"
export const COMPONENTS_VIRTUAL_MODULE = "virtual:mercur/components"
export const MENU_ITEMS_VIRTUAL_MODULE = "virtual:mercur/menu-items"

export const RESOLVED_CONFIG_MODULE = "\0" + CONFIG_VIRTUAL_MODULE
export const RESOLVED_ROUTES_MODULE = "\0" + ROUTES_VIRTUAL_MODULE
export const RESOLVED_COMPONENTS_MODULE = "\0" + COMPONENTS_VIRTUAL_MODULE
export const RESOLVED_MENU_ITEMS_MODULE = "\0" + MENU_ITEMS_VIRTUAL_MODULE

export const VIRTUAL_MODULES = [
    CONFIG_VIRTUAL_MODULE,
    ROUTES_VIRTUAL_MODULE,
    COMPONENTS_VIRTUAL_MODULE,
    MENU_ITEMS_VIRTUAL_MODULE,
]
