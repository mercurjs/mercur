declare module "virtual:mercur/config" {
    import type { MercurConfig } from "./index"
    const config: Omit<MercurConfig, 'components'>
    export default config
}

declare module "virtual:mercur/routes" {
    import type { RouteObject } from "react-router-dom"
    const routes: RouteObject[]
    export default routes
}

declare module "virtual:mercur/components" {
    import type { ComponentType } from "react"
    const components: {
        Sidebar?: ComponentType
        [key: string]: ComponentType | undefined
    }
    export default components
}