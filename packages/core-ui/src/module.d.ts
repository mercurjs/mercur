declare module "virtual:mercur/config" {
    import type { MercurConfig } from "./vite-plugin"
    const config: MercurConfig
    export default config
}

declare module "virtual:mercur/routes" {
    import type { RouteObject } from "react-router-dom"
    const routes: RouteObject[]
    export default routes
}