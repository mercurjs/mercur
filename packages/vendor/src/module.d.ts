declare module "virtual:mercur/routes" {
    import { Route } from './utils/routes'
    export const customRoutes: Route[]
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

declare module "virtual:mercur/menu-items" {
    import { MenuItem } from './utils/routes'
    const menuItems: { menuItems: MenuItem[] }
    export default menuItems
}

