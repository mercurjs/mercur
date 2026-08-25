import { createContext } from "react"
import type { PermissionsRequirementsContextValue } from "@mercurjs/dashboard-sdk"

export const PermissionsRequirementsContext =
  createContext<PermissionsRequirementsContextValue | null>(null)
