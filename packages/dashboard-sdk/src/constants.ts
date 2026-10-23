export const VALID_FILE_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"]

export const CONFIG_VIRTUAL_MODULE = "virtual:mercur/config"
export const ROUTES_VIRTUAL_MODULE = "virtual:mercur/routes"
export const MENU_ITEMS_VIRTUAL_MODULE = "virtual:mercur/menu-items"
export const I18N_VIRTUAL_MODULE = "virtual:mercur/i18n"
export const WIDGETS_VIRTUAL_MODULE = "virtual:mercur/widgets"
export const NAVIGATION_VIRTUAL_MODULE = "virtual:mercur/navigation"
export const CUSTOM_FIELDS_VIRTUAL_MODULE = "virtual:mercur/custom-fields"
export const LAYOUTS_VIRTUAL_MODULE = "virtual:mercur/layouts"
export const PREFERENCES_VIRTUAL_MODULE = "virtual:mercur/preferences"

export const RESOLVED_CONFIG_MODULE = "\0" + CONFIG_VIRTUAL_MODULE
export const RESOLVED_ROUTES_MODULE = "\0" + ROUTES_VIRTUAL_MODULE
export const RESOLVED_MENU_ITEMS_MODULE = "\0" + MENU_ITEMS_VIRTUAL_MODULE
export const RESOLVED_I18N_MODULE = "\0" + I18N_VIRTUAL_MODULE
export const RESOLVED_WIDGETS_MODULE = "\0" + WIDGETS_VIRTUAL_MODULE
export const RESOLVED_NAVIGATION_MODULE = "\0" + NAVIGATION_VIRTUAL_MODULE
export const RESOLVED_CUSTOM_FIELDS_MODULE = "\0" + CUSTOM_FIELDS_VIRTUAL_MODULE
export const RESOLVED_LAYOUTS_MODULE = "\0" + LAYOUTS_VIRTUAL_MODULE
export const RESOLVED_PREFERENCES_MODULE = "\0" + PREFERENCES_VIRTUAL_MODULE

export const VIRTUAL_MODULES = [
    CONFIG_VIRTUAL_MODULE,
    ROUTES_VIRTUAL_MODULE,
    MENU_ITEMS_VIRTUAL_MODULE,
    I18N_VIRTUAL_MODULE,
    WIDGETS_VIRTUAL_MODULE,
    NAVIGATION_VIRTUAL_MODULE,
    CUSTOM_FIELDS_VIRTUAL_MODULE,
    LAYOUTS_VIRTUAL_MODULE,
    PREFERENCES_VIRTUAL_MODULE,
]

/**
 * Packages whose state crosses package boundaries (React context, the i18n instance, a form's
 * `control`), so the dashboard and every plugin bundle must share one copy. Vite resolves them from
 * the project root, which means a project has to declare each of them.
 */
export const DEDUPED_DEPENDENCIES = [
    "react",
    "react-dom",
    "i18next",
    "react-i18next",
    "react-hook-form",
]

/** The file-name stem of a layer's code-level layout preferences. */
export const LAYOUT_PREFERENCES_FILE = "_layouts"
/** The file-name stem of the legacy host-only navigation overrides. */
export const NAVIGATION_FILE = "_navigation"
