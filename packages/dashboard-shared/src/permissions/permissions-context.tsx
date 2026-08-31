import { createContext } from "react"
import type { PermissionsContextValue } from "@mercurjs/dashboard-sdk"

export const PermissionsContext = createContext<PermissionsContextValue | null>(
  null
)
