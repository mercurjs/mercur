declare module "virtual:mercur/routes" {
    import { RouteObject } from 'react-router-dom'
    export const customRoutes: RouteObject[]
}

declare module "virtual:mercur/config" {
    import { MercurConfig } from '@mercurjs/dashboard-sdk'
    const config: MercurConfig
    export default config
}

declare module "virtual:mercur/components" {
    import { ComponentType } from 'react'
    const components: Record<string, ComponentType>
    export default components
}

