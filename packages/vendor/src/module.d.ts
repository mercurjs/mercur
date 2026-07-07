declare const __BASE__: string

declare module "virtual:mercur/routes" {
    import { Route } from './utils/routes'
    export const customRoutes: Route[]
}

declare module "virtual:mercur/config" {
    import { BuiltMercurConfig } from '@mercurjs/dashboard-sdk'
    const config: BuiltMercurConfig
    export default config
}

declare module "virtual:mercur/menu-items" {
    import { MenuItem } from './utils/routes'
    const menuItems: { menuItems: MenuItem[] }
    export default menuItems
}

declare module "virtual:mercur/i18n" {
    const i18nResources: Record<string, { translation: Record<string, any> }>
    export default i18nResources
}

declare module "virtual:mercur/widgets" {
    import { WidgetModule } from '@mercurjs/dashboard-shared'
    const widgets: WidgetModule
    export default widgets
}

declare module "virtual:mercur/navigation" {
    import { NavigationModule } from '@mercurjs/dashboard-shared'
    const navigation: NavigationModule
    export default navigation
}

declare module "virtual:mercur/custom-fields" {
    import { CustomFieldsModule } from '@mercurjs/dashboard-shared'
    const customFields: CustomFieldsModule
    export default customFields
}

