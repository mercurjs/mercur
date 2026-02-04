/**
 * Generate type definitions for @mercurjs/core-admin
 * These provide the public API types for consumers of the package
 */
import { existsSync, mkdirSync, writeFileSync } from "fs"
import { dirname, resolve } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const typeContent = `import { ComponentType, ReactNode } from "react"
import { LoaderFunction } from "react-router-dom"

/**
 * Route configuration from virtual:mercur-routes
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
  isModal?: boolean
}

/**
 * Plugin configuration for extending the dashboard
 */
export interface DashboardPlugin {
  widgetModule?: unknown
  routeModule?: unknown
  displayModule?: unknown
  formModule?: unknown
  menuItemModule?: unknown
}

/**
 * Props for the main App component
 */
export interface AppProps {
  plugins?: DashboardPlugin[]
  routes?: MercurRoute[]
}

/**
 * Main dashboard application component
 */
export declare function App(props: AppProps): JSX.Element

/**
 * Default export for backwards compatibility
 */
export default App

// =============================================================================
// Route Validation (Diagnostics)
// =============================================================================

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

/**
 * Validate routes and detect potential issues.
 *
 * Detects:
 * - ROUTE_COLLISION: Duplicate routes with same path
 * - MODAL_WITHOUT_PARENT: Modal route where parent has no Component
 * - ORPHAN_DYNAMIC_SEGMENT: Dynamic segment [id] without parent route
 * - UNREACHABLE_MODAL: Modal route nested under another modal
 * - EMPTY_PATH: Route with empty or missing path
 */
export declare function validateRoutes(routes: MercurRoute[]): RouteValidationResult

/**
 * Log validation issues to console with appropriate styling
 */
export declare function logValidationIssues(result: RouteValidationResult): void
`

async function generateTypes() {
  const distDir = resolve(__dirname, "../dist")
  const filePath = resolve(distDir, "app.d.ts")

  // Ensure the dist directory exists
  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true })
  }

  // Write the content to the app.d.ts file
  writeFileSync(filePath, typeContent, "utf8")

  console.log(`Type definitions created at ${filePath}`)
}

generateTypes().catch(console.error)
