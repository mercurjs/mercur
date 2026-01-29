declare module 'virtual:mercur-routes' {
  import type { ComponentType, ReactNode } from 'react'

  export interface MercurRoute {
    path: string
    Component: ComponentType
    Layout?: ComponentType<{ children: ReactNode }>
    ErrorBoundary?: ComponentType<{ error: Error }>
  }

  export const routes: MercurRoute[]
  export default routes
}
