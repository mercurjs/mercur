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
  /** Whether this route is a modal (renders over parent) */
  isModal?: boolean
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

const PUBLIC_PATHS = ["/login", "/invite", "/reset-password"]
const SETTINGS_PREFIX = "/settings"
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

function isModalSegment(segment: string): boolean {
  return MODAL_SEGMENTS.some(
    (modal) => segment === modal || segment.startsWith(modal + "-")
  )
}

function shouldTreatAsModal(node: RouteNode): boolean {
  if (node.route?.isModal !== undefined) {
    return node.route.isModal
  }
  return isModalSegment(node.segment)
}

interface RouteNode {
  segment: string
  fullPath: string
  route?: MercurRoute
  children: Map<string, RouteNode>
}

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

    currentNode.route = route
  }

  return root
}

function createRouteObject(
  route: MercurRoute,
  pathOverride?: string
): RouteObject {
  const routeObj: RouteObject = {
    path: pathOverride ?? route.path,
    errorElement: createElement(route.ErrorBoundary || ErrorBoundary),
  }

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

function flattenRouteTree(
  node: RouteNode,
  isModalChild = false,
  parentHasRoute = false
): RouteObject[] {
  const results: RouteObject[] = []

  if (node.route) {
    const modalChildren: RouteNode[] = []
    const pageChildren: RouteNode[] = []

    for (const child of node.children.values()) {
      if (shouldTreatAsModal(child)) {
        modalChildren.push(child)
      } else {
        pageChildren.push(child)
      }
    }

    const treatAsModalChild = isModalChild && parentHasRoute
    const routePath = treatAsModalChild ? node.segment : node.route.path
    const routeObj = createRouteObject(node.route, routePath)

    if (modalChildren.length > 0) {
      routeObj.element = createElement(PageWithOutlet, {
        Component: node.route.Component,
      })
      routeObj.loader = node.route.loader
      routeObj.children = [
        { index: true },
        ...modalChildren.flatMap((child) =>
          flattenRouteTree(child, true, true)
        ),
      ]
    } else {
      routeObj.lazy = async () => ({
        Component: node.route!.Component,
        loader: node.route!.loader,
      })
    }

    results.push(routeObj)

    for (const child of pageChildren) {
      results.push(...flattenRouteTree(child, false, true))
    }
  } else if (node.children.size > 0) {
    for (const child of node.children.values()) {
      const childIsModal = shouldTreatAsModal(child)
      results.push(...flattenRouteTree(child, childIsModal, false))
    }
  }

  return results
}

function processRoutes(routes: MercurRoute[]): RouteObject[] {
  const tree = buildRouteTree(routes)
  return flattenRouteTree(tree)
}

export function buildRoutes(
  routes: MercurRoute[],
  config: BuildRoutesConfig = {}
): RouteObject[] {
  const { coreRoutes = [], settingsRoutes = [] } = config

  const publicRoutes = routes.filter((r) => isPublicRoute(r.path))
  const mainRoutes = routes.filter((r) => isMainRoute(r.path))
  const settingsRoutesFromPages = routes.filter((r) => isSettingsRoute(r.path))

  const publicRouteObjects = processRoutes(publicRoutes)
  const mainRouteObjects = processRoutes(mainRoutes)
  const settingsRouteObjects = processRoutes(settingsRoutesFromPages)

  return [
    {
      element: createElement(ProtectedRoute),
      errorElement: createElement(ErrorBoundary),
      children: [
        {
          element: createElement(MainLayout),
          children: [
            {
              index: true,
              element: createElement(Navigate, { to: "/orders", replace: true }),
            },
            ...mainRouteObjects,
            ...coreRoutes,
          ],
        },
        {
          path: "settings",
          element: createElement(SettingsLayout),
          handle: {
            breadcrumb: () => "Settings",
          },
          children: [
            ...settingsRouteObjects.map((r) => ({
              ...r,
              path: r.path?.replace(/^settings\/?/, "") || undefined,
            })),
            ...settingsRoutes,
          ],
        },
      ],
    },
    {
      element: createElement(PublicLayout),
      children: publicRouteObjects,
    },
    {
      path: "*",
      lazy: () => import("../../pages/no-match"),
    },
  ]
}

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

export function getMainRoutes(routes: MercurRoute[]): MercurRoute[] {
  return routes.filter((r) => isMainRoute(r.path))
}

export function getSettingsRoutes(routes: MercurRoute[]): MercurRoute[] {
  return routes.filter((r) => isSettingsRoute(r.path))
}

export function getPublicRoutes(routes: MercurRoute[]): MercurRoute[] {
  return routes.filter((r) => isPublicRoute(r.path))
}

export type RouteValidationSeverity = "error" | "warning" | "info"

export interface RouteValidationIssue {
  severity: RouteValidationSeverity
  code: string
  message: string
  path: string
  details?: Record<string, unknown>
}

export interface RouteValidationResult {
  valid: boolean
  issues: RouteValidationIssue[]
}

export function validateRoutes(routes: MercurRoute[]): RouteValidationResult {
  const issues: RouteValidationIssue[] = []

  const pathMap = new Map<string, MercurRoute[]>()
  for (const route of routes) {
    const existing = pathMap.get(route.path) || []
    existing.push(route)
    pathMap.set(route.path, existing)
  }

  for (const [path, routesForPath] of pathMap) {
    if (routesForPath.length > 1) {
      issues.push({
        severity: "error",
        code: "ROUTE_COLLISION",
        message: `Multiple routes define the same path "${path}"`,
        path,
        details: {
          count: routesForPath.length,
        },
      })
    }
  }

  const tree = buildRouteTree(routes)

  function checkModalWithoutParent(node: RouteNode, parentNode?: RouteNode): void {
    if (shouldTreatAsModal(node) && node.route) {
      if (parentNode && !parentNode.route) {
        issues.push({
          severity: "warning",
          code: "MODAL_WITHOUT_PARENT",
          message: `Modal route "${node.fullPath}" has no parent with Component. It will render as flat route instead.`,
          path: node.fullPath,
          details: {
            parentPath: parentNode.fullPath,
            isExplicitModal: node.route.isModal === true,
            segment: node.segment,
          },
        })
      }
    }

    for (const child of node.children.values()) {
      checkModalWithoutParent(child, node)
    }
  }
  checkModalWithoutParent(tree)

  function checkOrphanDynamicSegments(node: RouteNode, parentNode?: RouteNode): void {
    const isDynamicSegment = /^\[.+\]$/.test(node.segment)

    if (isDynamicSegment && node.route && parentNode && !parentNode.route) {
      const grandParent = getParentPath(parentNode.fullPath)
      const hasGrandParentRoute = grandParent ? pathMap.has(grandParent) : false

      if (!hasGrandParentRoute && parentNode.fullPath !== "/") {
        issues.push({
          severity: "info",
          code: "ORPHAN_DYNAMIC_SEGMENT",
          message: `Dynamic route "${node.fullPath}" parent "${parentNode.fullPath}" has no route. This is valid but may indicate missing intermediate page.`,
          path: node.fullPath,
          details: {
            parentPath: parentNode.fullPath,
            segment: node.segment,
          },
        })
      }
    }

    for (const child of node.children.values()) {
      checkOrphanDynamicSegments(child, node)
    }
  }
  checkOrphanDynamicSegments(tree)

  function checkUnreachableModals(
    node: RouteNode,
    ancestorIsModal: boolean
  ): void {
    const nodeIsModal = node.route && shouldTreatAsModal(node)

    if (nodeIsModal && ancestorIsModal) {
      issues.push({
        severity: "warning",
        code: "UNREACHABLE_MODAL",
        message: `Modal route "${node.fullPath}" is nested under another modal. Only one level of modal nesting is supported.`,
        path: node.fullPath,
        details: {
          segment: node.segment,
        },
      })
    }

    for (const child of node.children.values()) {
      checkUnreachableModals(child, nodeIsModal || ancestorIsModal)
    }
  }
  checkUnreachableModals(tree, false)

  for (const route of routes) {
    if (!route.path || route.path.trim() === "") {
      issues.push({
        severity: "error",
        code: "EMPTY_PATH",
        message: "Route has empty or missing path",
        path: route.path || "(empty)",
      })
    }
  }

  return {
    valid: !issues.some((i) => i.severity === "error"),
    issues,
  }
}

function getParentPath(path: string): string | null {
  const segments = path.split("/").filter(Boolean)
  if (segments.length <= 1) return null
  return "/" + segments.slice(0, -1).join("/")
}

export function logValidationIssues(result: RouteValidationResult): void {
  if (result.issues.length === 0) {
    console.log("[mercur-routes] ✓ All routes validated successfully")
    return
  }

  const errors = result.issues.filter((i) => i.severity === "error")
  const warnings = result.issues.filter((i) => i.severity === "warning")
  const infos = result.issues.filter((i) => i.severity === "info")

  if (errors.length > 0) {
    console.error(`[mercur-routes] ✗ ${errors.length} route error(s):`)
    for (const issue of errors) {
      console.error(`  [${issue.code}] ${issue.message}`)
    }
  }

  if (warnings.length > 0) {
    console.warn(`[mercur-routes] ⚠ ${warnings.length} route warning(s):`)
    for (const issue of warnings) {
      console.warn(`  [${issue.code}] ${issue.message}`)
    }
  }

  if (infos.length > 0) {
    console.info(`[mercur-routes] ℹ ${infos.length} route info(s):`)
    for (const issue of infos) {
      console.info(`  [${issue.code}] ${issue.message}`)
    }
  }
}
