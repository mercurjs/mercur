import { ComponentType } from "react";

export interface MercurConfig {
    medusaConfigPath: string
    backendUrl?: string
    name?: string
    logo?: string
    components?: {
        MainSidebar?: string
        SettingsSidebar?: string
        TopbarActions?: string
    },
    i18n?: {
        defaultLanguage: string
    }
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
