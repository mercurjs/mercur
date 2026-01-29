import type { ComponentType, ReactNode } from 'react'

export interface MercurRoute {
  path: string
  Component: ComponentType
  Layout?: ComponentType<{ children: ReactNode }>
  ErrorBoundary?: ComponentType<{ error: Error }>
}

export interface AdminAppProps {
  /** Routes from virtual:mercur-routes */
  routes: MercurRoute[]
  /** Base path for the admin (default: '/') */
  basePath?: string
  /** Custom providers to wrap the app */
  providers?: ComponentType<{ children: ReactNode }>[]
}

export interface CreateAdminAppOptions extends AdminAppProps {
  /** Root element to mount the app */
  root: HTMLElement
}
