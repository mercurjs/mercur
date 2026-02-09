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

export type Route = {
    Component: string
    path: string
    handle?: string
    loader?: string
    children?: Route[]
}

export type MenuItem = {
    label: string
    icon?: ComponentType
    path: string
    rank?: number
    nested?: string
    translationNs?: string
}

export type RouteConfig = {
    label: string
    icon?: ComponentType
    rank?: number
    nested?: string
    translationNs?: string
}
