import React from "react"
import ReactDOM from "react-dom/client"

import {
  App,
  validateRoutes,
  logValidationIssues,
} from "@mercurjs/core-admin"
import "@mercurjs/core-admin/styles.css"
import { routes } from "virtual:mercur-routes"
import { sections, items } from "virtual:mercur-navigation"

if (import.meta.env.DEV) {
  const validation = validateRoutes(routes)
  logValidationIssues(validation)

  console.log("[mercur-navigation] Sections:", sections)
  console.log("[mercur-navigation] Items:", items)
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App routes={routes} />
  </React.StrictMode>
)
