import { useContext } from "react"
import { PermissionsRequirementsContext } from "./permissions-requirements-context"

export const useRequiredPermissions = () => {
  const context = useContext(PermissionsRequirementsContext)

  return context?.requiredPermissions ?? []
}
