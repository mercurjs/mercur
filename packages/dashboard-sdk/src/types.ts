export interface MercurConfig {
    title: string
    description: string
    components: {
        Sidebar?: string
    }
    /** Path to core-admin pages directory (relative to project root) */
    corePagesDir?: string
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
