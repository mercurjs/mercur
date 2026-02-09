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
    icon?: string
    children?: Route[]
}
