declare module "virtual:mercur/routes" {
    import { RouteObject } from 'react-router-dom'
    const routes: RouteObject[]
    export default routes
}

declare module "virtual:mercur/config" {
    import { MercurConfig } from '@mercurjs/dashboard-sdk'
    const config: MercurConfig
    export default config
}

declare module "virtual:mercur/components" {
    import { Component } from 'react'
    const components: Record<string, Component>
    export default components
}
