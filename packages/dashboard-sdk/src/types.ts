import { ComponentType } from "react";

export interface MercurConfig {
    title: string
    description: string
    components: {
        MainSidebar?: string
        SettingsSidebar?: string
    },
    baseUrl: string;
}

export interface BuiltMercurConfig extends MercurConfig {
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
}
