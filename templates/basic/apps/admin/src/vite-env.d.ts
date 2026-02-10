/// <reference types="vite/client" />

declare const __BACKEND_URL__: string | undefined
declare const __STOREFRONT_URL__: string | undefined
declare const __BASE__: string
declare const __B2B_PANEL__: string | undefined
declare const __TALK_JS_APP_ID__: string | undefined

// Virtual module types from @mercurjs/vite-plugin
declare module "virtual:mercur-routes" {
  import type { MercurRoute } from "@mercurjs/vite-plugin"
  export type { MercurRoute }
  export const routes: MercurRoute[]
}

declare module "virtual:mercur-navigation" {
  import type { NavItem, NavSection } from "@mercurjs/vite-plugin"
  export type { NavItem, NavSection }
  export const sections: NavSection[]
  export const items: NavItem[]
}
