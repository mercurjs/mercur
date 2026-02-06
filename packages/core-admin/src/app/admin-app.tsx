import { useMemo, StrictMode } from 'react'
import {
  createBrowserRouter,
  RouterProvider,
  useRouteError,
} from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import type { MercurRoute, AdminAppProps, CreateAdminAppOptions } from './types'

/**
 * Default error boundary component
 */
function DefaultErrorBoundary() {
  const error = useRouteError() as Error
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {error?.message || 'Unknown error'}
      </pre>
    </div>
  )
}

/**
 * Build React Router routes from MercurRoute array
 */
function buildRouterRoutes(routes: MercurRoute[]) {
  // Group routes by layout
  const routesByLayout = new Map<string | undefined, MercurRoute[]>()

  for (const route of routes) {
    // Find the layout path (parent path that has a layout)
    const layoutKey = route.Layout ? route.path : undefined
    const existing = routesByLayout.get(layoutKey) || []
    existing.push(route)
    routesByLayout.set(layoutKey, existing)
  }

  // Convert to React Router format
  return routes.map((route) => {
    const routeConfig: any = {
      path: route.path,
      element: route.Layout ? (
        <route.Layout>
          <route.Component />
        </route.Layout>
      ) : (
        <route.Component />
      ),
      errorElement: route.ErrorBoundary ? (
        <route.ErrorBoundary error={new Error()} />
      ) : (
        <DefaultErrorBoundary />
      ),
    }

    return routeConfig
  })
}

/**
 * AdminApp - Main component for rendering the admin application
 *
 * @example
 * import { AdminApp } from '@mercurjs/core-admin/app'
 * import routes from 'virtual:mercur-routes'
 *
 * function App() {
 *   return <AdminApp routes={routes} />
 * }
 */
export function AdminApp({ routes, basePath = '/', providers = [] }: AdminAppProps) {
  const router = useMemo(() => {
    const routerRoutes = buildRouterRoutes(routes)
    return createBrowserRouter(routerRoutes, {
      basename: basePath,
    })
  }, [routes, basePath])

  // Wrap with providers (innermost first)
  let content = <RouterProvider router={router} />

  // Wrap with custom providers (reverse order so first provider is outermost)
  for (const Provider of [...providers].reverse()) {
    content = <Provider>{content}</Provider>
  }

  return content
}

/**
 * Create and mount the admin application
 *
 * @example
 * import { createAdminApp } from '@mercurjs/core-admin/app'
 * import routes from 'virtual:mercur-routes'
 *
 * createAdminApp({
 *   root: document.getElementById('root')!,
 *   routes,
 * })
 */
export function createAdminApp(options: CreateAdminAppOptions) {
  const { root, ...appProps } = options

  const reactRoot = createRoot(root)
  reactRoot.render(
    <StrictMode>
      <AdminApp {...appProps} />
    </StrictMode>
  )

  return reactRoot
}
