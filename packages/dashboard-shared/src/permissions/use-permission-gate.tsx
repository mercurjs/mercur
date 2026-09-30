import { useContext } from "react"
import { useTranslation } from "react-i18next"
import type { Permission } from "@mercurjs/dashboard-sdk"
import { isPermitted } from "./permission-check"
import { PermissionsContext } from "./permissions-context"

/**
 * For controls that stay visible but must not fire when the actor lacks the
 * permission of the endpoint they call.
 *
 * @example
 * ```tsx
 * const gate = usePermissionGate("orders:edit")
 *
 * <Tooltip content={gate.tooltip}>
 *   <Button disabled={gate.denied}>Cancel</Button>
 * </Tooltip>
 * ```
 */
export const usePermissionGate = (
  permission?: Permission | Permission[],
  requireAll = false
) => {
  const { t } = useTranslation()
  const context = useContext(PermissionsContext)
  const allowed = isPermitted(context, permission, requireAll)

  return {
    allowed,
    denied: !allowed,
    tooltip: allowed ? undefined : t("permissions.accessDenied.action"),
  }
}
