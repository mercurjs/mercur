import { ComponentType, createElement, ReactNode, Fragment } from "react"
import { LoaderFunction, Navigate, Outlet, RouteObject } from "react-router-dom"
import { ErrorBoundary } from "@components/utilities/error-boundary"
import { ProtectedRoute } from "@components/authentication/protected-route"
import { MainLayout } from "@components/layout/main-layout"
import { PublicLayout } from "@components/layout/public-layout"
import { SettingsLayout } from "@components/layout/settings-layout"

/**
 * Wrapper component that renders page content alongside Outlet for modal routes.
 * This enables modal routes (edit, create, delete) to render over parent content.
 */
function PageWithOutlet({ Component }: { Component: ComponentType }) {
  return createElement(Fragment, null, createElement(Component), createElement(Outlet))
}

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
 * Configuration for building routes
 */
export interface BuildRoutesConfig {
  /** Additional routes from plugins (injected into main layout) */
  coreRoutes?: RouteObject[]
  /** Additional settings routes from plugins */
  settingsRoutes?: RouteObject[]
}

// =============================================================================
// Route Classification
// =============================================================================

/** Public routes that don't require authentication */
const PUBLIC_PATHS = ["/login", "/invite", "/reset-password"]

/** Settings routes */
const SETTINGS_PREFIX = "/settings"

/** Modal route segments - these render as children (overlay on parent) */
const MODAL_SEGMENTS = ["edit", "create", "delete", "add", "remove", "manage"]

function isPublicRoute(path: string): boolean {
  return PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"))
}

function isSettingsRoute(path: string): boolean {
  return path.startsWith(SETTINGS_PREFIX)
}

function isMainRoute(path: string): boolean {
  return !isPublicRoute(path) && !isSettingsRoute(path)
}

/**
 * Check if a route segment represents a modal route.
 * Modal routes render as overlay on parent content.
 */
function isModalSegment(segment: string): boolean {
  // Exact match or starts with modal keyword (e.g., "add-products")
  return MODAL_SEGMENTS.some(
    (modal) => segment === modal || segment.startsWith(modal + "-")
  )
}

// =============================================================================
// Route Tree Building
// =============================================================================

interface RouteNode {
  segment: string
  fullPath: string
  route?: MercurRoute
  children: Map<string, RouteNode>
}

/**
 * Build a tree structure from flat routes
 */
function buildRouteTree(routes: MercurRoute[]): RouteNode {
  const root: RouteNode = {
    segment: "",
    fullPath: "/",
    children: new Map(),
  }

  for (const route of routes) {
    const segments = route.path.split("/").filter(Boolean)
    let currentNode = root

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      const fullPath = "/" + segments.slice(0, i + 1).join("/")

      if (!currentNode.children.has(segment)) {
        currentNode.children.set(segment, {
          segment,
          fullPath,
          children: new Map(),
        })
      }

      currentNode = currentNode.children.get(segment)!
    }

    // Attach route to the final node
    currentNode.route = route
  }

  return root
}

// =============================================================================
// Route Conversion - FLAT structure with modal children
// =============================================================================

/**
 * Convert MercurRoute to RouteObject with element (not lazy) for modal routes
 */
function createRouteObject(
  route: MercurRoute,
  pathOverride?: string
): RouteObject {
  const routeObj: RouteObject = {
    path: pathOverride ?? route.path,
    errorElement: createElement(route.ErrorBoundary || ErrorBoundary),
  }

  // Build handle with breadcrumb
  let handle = route.handle ? { ...route.handle } : undefined

  if (route.Breadcrumb) {
    handle = handle || {}
    handle.breadcrumb = (match: unknown) => {
      const typedMatch = match as { data: unknown }
      return createElement(route.Breadcrumb!, { data: typedMatch.data })
    }
  }

  if (handle) {
    routeObj.handle = handle
  }

  return routeObj
}

/**
 * Convert route tree to FLAT RouteObjects.
 *
 * Key logic:
 * - Modal routes (edit, create, delete) become CHILDREN of parent (render in Outlet)
 *   BUT ONLY if parent has a route! Otherwise they become flat routes.
 * - Page routes become FLAT siblings (replace parent content)
 *
 * This allows:
 * - /products/:id/edit → modal over ProductDetail (parent has route)
 * - /products/:id/variants/:variant_id → replaces ProductDetail (flat route)
 * - /orders/:id/:f_id/create-shipment → flat route (parent [f_id] has no route)
 */
function flattenRouteTree(
  node: RouteNode,
  isModalChild = false,
  parentHasRoute = false
): RouteObject[] {
  const results: RouteObject[] = []

  // Process this node
  if (node.route) {
    // Separate children into modals and pages
    // Modal segments are only treated as modals if THIS node has a route (they can nest here)
    const modalChildren: RouteNode[] = []
    const pageChildren: RouteNode[] = []

    for (const child of node.children.values()) {
      if (isModalSegment(child.segment)) {
        modalChildren.push(child)
      } else {
        pageChildren.push(child)
      }
    }

    // Determine if this node should be treated as modal child:
    // - isModalChild=true means parent wanted us to be modal
    // - But we can only be modal if parent actually had a route
    const treatAsModalChild = isModalChild && parentHasRoute

    // Determine path:
    // - Modal children use just the segment (they're nested under parent)
    // - Flat routes use full path from route.path
    const routePath = treatAsModalChild ? node.segment : node.route.path

    // Create route object for this node
    const routeObj = createRouteObject(node.route, routePath)

    if (modalChildren.length > 0) {
      // This route has modal children - wrap with Outlet
      routeObj.element = createElement(PageWithOutlet, {
        Component: node.route.Component,
      })
      routeObj.loader = node.route.loader

      // Modal routes are children (render in Outlet)
      // Pass parentHasRoute=true because THIS node has a route
      routeObj.children = [
        { index: true }, // Empty index, content is in PageWithOutlet
        ...modalChildren.flatMap((child) =>
          flattenRouteTree(child, true, true)
        ),
      ]
    } else {
      // No modal children - use lazy loading
      routeObj.lazy = async () => ({
        Component: node.route!.Component,
        loader: node.route!.loader,
      })
    }

    results.push(routeObj)

    // Page children are FLAT (siblings, not nested)
    // Pass parentHasRoute=true because THIS node has a route
    for (const child of pageChildren) {
      results.push(...flattenRouteTree(child, false, true))
    }
  } else if (node.children.size > 0) {
    // No route at this node, just process children
    // Modal segments without parent route become flat routes
    for (const child of node.children.values()) {
      // Even if child is modal segment, pass parentHasRoute=false
      // so it will be treated as flat route (full path)
      const childIsModal = isModalSegment(child.segment)
      results.push(...flattenRouteTree(child, childIsModal, false))
    }
  }

  return results
}

/**
 * Process routes for a section (main, settings, public)
 */
function processRoutes(routes: MercurRoute[]): RouteObject[] {
  const tree = buildRouteTree(routes)
  return flattenRouteTree(tree)
}

// =============================================================================
// Main Export: Build Full Route Structure
// =============================================================================

/**
 * Build the complete route structure from MercurRoutes
 *
 * Creates a structure where:
 * - Modal routes (edit, create, delete) are CHILDREN of parent (overlay)
 * - Page routes are FLAT (replace parent content)
 * - Public routes (login, invite) → PublicLayout
 * - Main routes → ProtectedRoute + MainLayout
 * - Settings routes → ProtectedRoute + SettingsLayout
 *
 * @param routes - Flat routes from virtual:mercur-routes
 * @param config - Additional routes from plugins
 */
export function buildRoutes(
  routes: MercurRoute[],
  config: BuildRoutesConfig = {}
): RouteObject[] {
  const { coreRoutes = [], settingsRoutes = [] } = config

  // Classify routes
  const publicRoutes = routes.filter((r) => isPublicRoute(r.path))
  const mainRoutes = routes.filter((r) => isMainRoute(r.path))
  const settingsRoutesFromPages = routes.filter((r) => isSettingsRoute(r.path))

  // Process routes (flat structure with modal children)
  const publicRouteObjects = processRoutes(publicRoutes)
  const mainRouteObjects = processRoutes(mainRoutes)
  const settingsRouteObjects = processRoutes(settingsRoutesFromPages)

  // Build final structure
  return [
    // Protected routes (authenticated)
    {
      element: createElement(ProtectedRoute),
      errorElement: createElement(ErrorBoundary),
      children: [
        // Main layout (with sidebar) - for non-settings routes
        {
          element: createElement(MainLayout),
          children: [
            // Index route - redirect to /orders
            {
              index: true,
              element: createElement(Navigate, { to: "/orders", replace: true }),
            },
            // Main routes (flat with modal children)
            ...mainRouteObjects,
            // Plugin core routes
            ...coreRoutes,
          ],
        },
        // Settings layout (separate from main) - for /settings/* routes
        {
          path: "settings",
          element: createElement(SettingsLayout),
          handle: {
            breadcrumb: () => "Settings",
          },
          children: [
            // Settings routes (strip /settings prefix from paths)
            ...settingsRouteObjects.map((r) => ({
              ...r,
              path: r.path?.replace(/^settings\/?/, "") || undefined,
            })),
            // Plugin settings routes
            ...settingsRoutes,
          ],
        },
      ],
    },
    // Public routes (unauthenticated)
    {
      element: createElement(PublicLayout),
      children: publicRouteObjects,
    },
    // 404 catch-all
    {
      path: "*",
      lazy: () => import("../../pages/no-match"),
    },
  ]
}

// =============================================================================
// Utility Functions (for debugging/testing)
// =============================================================================

/**
 * Debug: print route tree
 */
export function printRouteTree(routes: RouteObject[], indent = 0): void {
  const prefix = "  ".repeat(indent)
  for (const route of routes) {
    const pathStr = route.path || (route.index ? "(index)" : "(wrapper)")
    const hasLazy = route.lazy ? " [lazy]" : ""
    const hasElement = route.element ? " [element]" : ""
    const hasChildren = route.children ? ` [${route.children.length} children]` : ""
    console.log(`${prefix}${pathStr}${hasLazy}${hasElement}${hasChildren}`)
    if (route.children) {
      printRouteTree(route.children, indent + 1)
    }
  }
}

/**
 * Get routes for a specific section (for testing)
 */
export function getMainRoutes(routes: MercurRoute[]): MercurRoute[] {
  return routes.filter((r) => isMainRoute(r.path))
}

export function getSettingsRoutes(routes: MercurRoute[]): MercurRoute[] {
  return routes.filter((r) => isSettingsRoute(r.path))
}

export function getPublicRoutes(routes: MercurRoute[]): MercurRoute[] {
  return routes.filter((r) => isPublicRoute(r.path))
}
