import { useCan } from "@mercurjs/dashboard-shared"
import type { PermissionKey, PermissionRight } from "@mercurjs/dashboard-sdk"
import { useMemo } from "react"

export const useActionBlocker = (
  key: PermissionKey,
  right: PermissionRight
): { disabled: boolean; disabledTooltip?: string } => {
  const allowed = useCan(key, right)

  return useMemo(
    () =>
      allowed
        ? { disabled: false }
        : { disabled: true, disabledTooltip: "You do not have permission to do this" },
    [allowed]
  )
}
