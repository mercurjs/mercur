import { ComponentType, createElement, ReactNode } from "react"
import { LoaderFunction, RouteObject } from "react-router-dom"
import { ErrorBoundary } from "../../components/utilities/error-boundary"

/**
 * Route from virtual:mercur-routes
 */
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

/**
 * Convert a MercurRoute to a React Router RouteObject
 */
export function mercurRouteToRouteObject(route: MercurRoute): RouteObject {
  const routeObj: RouteObject = {
    path: route.path,
    ErrorBoundary: route.ErrorBoundary || ErrorBoundary,
  }

  // Build handle with breadcrumb
  let handle = route.handle ? { ...route.handle } : undefined

  if (route.Breadcrumb) {
    handle = handle || {}
    handle.breadcrumb = (match: { data: unknown }) =>
      createElement(route.Breadcrumb!, { data: match.data })
  }

  // Use lazy for code splitting
  routeObj.lazy = async () => {
    const result: {
      Component: ComponentType
      loader?: LoaderFunction
      handle?: object
    } = {
      Component: route.Component,
    }

    if (route.loader) {
      result.loader = route.loader
    }

    if (handle) {
      result.handle = handle
    }

    return result
  }

  return routeObj
}

/**
 * Convert array of MercurRoutes to flat RouteObjects
 * These can be added to existing route structure
 */
export function convertMercurRoutes(routes: MercurRoute[]): RouteObject[] {
  return routes.map(mercurRouteToRouteObject)
}

/**
 * Find routes that match a path prefix
 */
export function filterRoutesByPrefix(
  routes: MercurRoute[],
  prefix: string
): MercurRoute[] {
  return routes.filter((route) => route.path.startsWith(prefix))
}

/**
 * Find routes that don't match a path prefix
 */
export function filterRoutesExcludingPrefix(
  routes: MercurRoute[],
  prefix: string
): MercurRoute[] {
  return routes.filter((route) => !route.path.startsWith(prefix))
}

/**
 * Get main routes (not settings)
 */
export function getMainRoutes(routes: MercurRoute[]): MercurRoute[] {
  return filterRoutesExcludingPrefix(routes, "/settings")
}

/**
 * Get settings routes
 */
export function getSettingsRoutes(routes: MercurRoute[]): MercurRoute[] {
  return filterRoutesByPrefix(routes, "/settings")
}

/**
 * Build nested route structure from flat routes
 *
 * Takes flat routes like:
 * - /products
 * - /products/:id
 * - /products/:id/edit
 *
 * And creates nested structure:
 * {
 *   path: "products",
 *   children: [
 *     { path: "", lazy: () => ProductsList },
 *     {
 *       path: ":id",
 *       children: [
 *         { path: "", lazy: () => ProductDetail },
 *         { path: "edit", lazy: () => ProductEdit }
 *       ]
 *     }
 *   ]
 * }
 */
export function buildNestedRoutes(routes: MercurRoute[]): RouteObject[] {
  // Sort by path depth (shorter paths first)
  const sortedRoutes = [...routes].sort((a, b) => {
    const depthA = a.path.split("/").filter(Boolean).length
    const depthB = b.path.split("/").filter(Boolean).length
    return depthA - depthB
  })

  const root: RouteObject[] = []
  const pathToNode = new Map<string, RouteObject>()

  for (const route of sortedRoutes) {
    const segments = route.path.split("/").filter(Boolean)

    if (segments.length === 0) {
      // Root route "/"
      const routeObj = mercurRouteToRouteObject(route)
      routeObj.path = "/"
      root.push(routeObj)
      pathToNode.set("/", routeObj)
      continue
    }

    // Find parent path
    const parentSegments = segments.slice(0, -1)
    const parentPath =
      parentSegments.length === 0 ? "/" : "/" + parentSegments.join("/")
    const currentSegment = segments[segments.length - 1]

    // Get or create parent node
    let parentNode = pathToNode.get(parentPath)
    let targetLevel: RouteObject[]

    if (parentNode) {
      parentNode.children = parentNode.children || []
      targetLevel = parentNode.children
    } else if (parentPath === "/") {
      targetLevel = root
    } else {
      // Need to create intermediate nodes
      let currentLevel = root
      let currentPath = ""

      for (let i = 0; i < parentSegments.length; i++) {
        const seg = parentSegments[i]
        currentPath = currentPath ? `${currentPath}/${seg}` : `/${seg}`

        let node = pathToNode.get(currentPath)
        if (!node) {
          node = {
            path: seg,
            children: [],
          }
          currentLevel.push(node)
          pathToNode.set(currentPath, node)
        }
        node.children = node.children || []
        currentLevel = node.children
      }

      targetLevel = currentLevel
    }

    // Check if there's already a node for this segment (branch node)
    const existingNode = targetLevel.find((r) => r.path === currentSegment)

    if (existingNode) {
      // Add as index route
      existingNode.children = existingNode.children || []
      const indexRoute = mercurRouteToRouteObject(route)
      indexRoute.path = ""
      existingNode.children.unshift(indexRoute)
    } else {
      // Create new node
      const routeObj = mercurRouteToRouteObject(route)
      routeObj.path = currentSegment
      targetLevel.push(routeObj)
      pathToNode.set(route.path, routeObj)
    }
  }

  return root
}

/**
 * Debug: print route tree
 */
export function printRouteTree(routes: RouteObject[], indent = 0): void {
  const prefix = "  ".repeat(indent)
  for (const route of routes) {
    const pathStr = route.path || "(index)"
    const hasLazy = route.lazy ? " [lazy]" : ""
    const hasElement = route.element ? " [element]" : ""
    console.log(`${prefix}${pathStr}${hasLazy}${hasElement}`)
    if (route.children) {
      printRouteTree(route.children, indent + 1)
    }
  }
}
