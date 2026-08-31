import { useContext, useEffect, useId } from "react"
import type { Permission } from "@mercurjs/dashboard-sdk"
import { PermissionsRequirementsContext } from "./permissions-requirements-context"

export interface UseRegisterPermissionsOptions {
  /** If true, ALL permissions are required. Defaults to ANY. */
  requireAll?: boolean
  source?: string
  enabled?: boolean
}

const normalizePermissions = (permissions: Permission[]): Permission[] =>
  Array.from(new Set(permissions)).sort()

// Stable identity so the effect below doesn't re-run every render when there
// is no requirements context to register with.
const noop = () => {}

/**
 * Declares what the calling subtree needs. No-ops when there is no
 * `PermissionsRequirementsProvider` above it.
 */
export const useRegisterPermissions = (
  permissions: Permission[] | null | undefined,
  options: UseRegisterPermissionsOptions = {}
) => {
  const context = useContext(PermissionsRequirementsContext)
  const registerRequiredPermissions = context?.registerRequiredPermissions ?? noop
  const unregisterRequiredPermissions =
    context?.unregisterRequiredPermissions ?? noop
  const id = useId()

  const enabled = options.enabled ?? true
  const requireAll = options.requireAll ?? false
  const source = options.source

  const permissionsKey = permissions?.length
    ? normalizePermissions(permissions).join("|")
    : ""

  useEffect(() => {
    if (!enabled || !permissionsKey) {
      return
    }

    registerRequiredPermissions(id, {
      permissions: permissionsKey.split("|") as Permission[],
      requireAll,
      source,
    })

    return () => {
      unregisterRequiredPermissions(id)
    }
  }, [
    enabled,
    id,
    permissionsKey,
    registerRequiredPermissions,
    requireAll,
    source,
    unregisterRequiredPermissions,
  ])
}
