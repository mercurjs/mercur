import { ComponentType } from "react";

export interface MercurConfig {
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
    backendUrl?: string;
}

export interface BuiltMercurConfig extends MercurConfig {
    backendUrl: string;
    root: string
    srcDir: string
    configPath: string
}

export type RouteConfig = {
    label: string
    icon?: ComponentType
    rank?: number
    nested?: string
    translationNs?: string
    public?: boolean
}
