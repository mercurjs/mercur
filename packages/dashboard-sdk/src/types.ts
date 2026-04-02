import { ComponentType } from "react";

/**
 * Configuration for the Mercur dashboard plugin.
 *
 * Passed to `mercurDashboardPlugin()` in `vite.config.ts` to configure
 * the vendor or admin dashboard at build time.
 *
 * @example
 * ```ts
 * mercurDashboardPlugin({
 *   medusaConfigPath: '../../packages/api/medusa-config.ts',
 *   enableSellerRegistration: true,
 * })
 * ```
 */
export interface MercurConfig {
    /** Path to the MedusaJS config file, resolved relative to the project root. */
    medusaConfigPath: string
    /**
     * Backend URL for API requests.
     * @default "http://localhost:9000"
     */
    backendUrl?: string
    /** Dashboard display name. */
    name?: string
    /** Path to a logo asset for the dashboard. */
    logo?: string
    /**
     * Override built-in layout components with custom implementations.
     * Paths are resolved relative to `src/`.
     */
    components?: {
        MainSidebar?: string
        SettingsSidebar?: string
        TopbarActions?: string
    },
    /** Internationalization settings. */
    i18n?: {
        /** The default language code (e.g. `"en"`). */
        defaultLanguage: string
    }
    /** Whether to allow new sellers to register from the login screen. */
    enableSellerRegistration?: boolean;
}

export interface BuiltMercurConfig extends MercurConfig {
    backendUrl: string;
    base?: string;
    root: string
    srcDir: string
    pluginExtensions: string[]
}

export type RouteConfig = {
    label: string
    icon?: ComponentType
    rank?: number
    nested?: string
    translationNs?: string
    public?: boolean
}
