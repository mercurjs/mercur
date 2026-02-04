import { DashboardApp } from "./dashboard-app"
import { DashboardPlugin } from "./dashboard-app/types"
import { MercurRoute } from "./dashboard-app/routes/route-builder"

import displayModule from "virtual:medusa/displays"
import formModule from "virtual:medusa/forms"
import menuItemModule from "virtual:medusa/menu-items"
import routeModule from "virtual:medusa/routes"
import widgetModule from "virtual:medusa/widgets"

import "./index.css"

const localPlugin = {
  widgetModule,
  routeModule,
  displayModule,
  formModule,
  menuItemModule,
}

interface AppProps {
  plugins?: DashboardPlugin[]
  /**
   * Routes from virtual:mercur-routes
   * If provided, uses file-based routing
   * If not provided, falls back to legacy getRouteMap
   */
  routes?: MercurRoute[]
}

function App({ plugins = [], routes }: AppProps) {
  const app = new DashboardApp({
    plugins: [localPlugin, ...plugins],
    routes,
  })

  return <div>{app.render()}</div>
}

// Default export for backwards compatibility
export default App

// Named export (preferred)
export { App }

// Re-export types for external usage
export type { MercurRoute } from "./dashboard-app/routes/route-builder"
export type { DashboardPlugin } from "./dashboard-app/types"

// Re-export validation utilities for diagnostics
export {
  validateRoutes,
  logValidationIssues,
} from "./dashboard-app/routes/route-builder"
export type {
  RouteValidationResult,
  RouteValidationIssue,
  RouteValidationSeverity,
} from "./dashboard-app/routes/route-builder"
