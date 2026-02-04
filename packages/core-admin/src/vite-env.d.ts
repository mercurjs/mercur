// / <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MEDUSA_ADMIN_BACKEND_URL: string
  readonly VITE_MEDUSA_STOREFRONT_URL: string
  readonly VITE_MEDUSA_V2: "true" | "false"
}

interface ImportMeta {
  readonly env: ImportMetaEnv
  readonly hot: {
    accept: () => void
  }
}

declare const __BACKEND_URL__: string | undefined
declare const __STOREFRONT_URL__: string | undefined
declare const __BASE__: string
declare const __TALK_JS_APP_ID__: string | undefined

// Virtual modules from @mercurjs/vite-plugin
declare module "virtual:mercur-routes" {
  import type { ComponentType, ReactNode } from "react"
  import type { LoaderFunction } from "react-router-dom"

  export interface MercurRoute {
    path: string
    Component: ComponentType
    loader?: LoaderFunction
    handle?: {
      breadcrumb?: (match: unknown) => ReactNode | string
      [key: string]: unknown
    }
    Breadcrumb?: ComponentType<{ data: unknown }>
    Layout?: ComponentType<{ children: ReactNode }>
    ErrorBoundary?: ComponentType<{ error: Error }>
  }

  export const routes: MercurRoute[]
}

declare module "virtual:mercur-navigation" {
  export interface NavItem {
    id: string
    label?: string
    labelKey?: string
    iconKey?: string
    path?: string
    parent?: string
    section?: string
    order?: number
    hidden?: boolean
  }

  export interface NavSection {
    id: string
    label?: string
    labelKey?: string
    order?: number
  }

  export const sections: NavSection[]
  export const items: NavItem[]
}
