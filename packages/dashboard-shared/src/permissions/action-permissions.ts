import { useContext, useMemo, type ReactNode } from "react"
import type { Permission, PermissionsContextValue } from "@mercurjs/dashboard-sdk"
import { isPermitted } from "./permission-check"
import { PermissionsContext } from "./permissions-context"

type PermissionChecks = Pick<
  PermissionsContextValue,
  "hasAnyPermission" | "hasAllPermissions"
>

type Permissioned = {
  permission?: Permission | Permission[]
  requireAll?: boolean
}

type DisableableAction = Permissioned & {
  disabled?: boolean
  disabledTooltip?: string | ReactNode
}

/**
 * Disables the actions the actor lacks the permission for and explains why in
 * the tooltip. The action stays visible so the menu doesn't change shape
 * between roles.
 */
export const applyActionPermissions = <
  TAction extends DisableableAction,
  TGroup extends { actions: TAction[] },
>(
  groups: TGroup[],
  checks: PermissionChecks | null,
  deniedTooltip: string
): TGroup[] =>
  groups.map((group) => ({
    ...group,
    actions: group.actions.map((action) =>
      isPermitted(checks, action.permission, action.requireAll)
        ? action
        : { ...action, disabled: true, disabledTooltip: deniedTooltip }
    ),
  }))

export type PermissionedCommand<TCommand> = TCommand & Permissioned

/**
 * The Medusa UI command bar can't render a disabled command, so bulk commands
 * the actor may not run are left out.
 */
export const filterCommandsByPermission = <TCommand>(
  commands: PermissionedCommand<TCommand>[],
  checks: PermissionChecks | null
): TCommand[] =>
  commands
    .filter((command) =>
      isPermitted(checks, command.permission, command.requireAll)
    )
    .map(({ permission: _permission, requireAll: _requireAll, ...command }) =>
      command as TCommand
    )

/**
 * @example
 * ```tsx
 * const commands = usePermittedCommands([
 *   { label: t("actions.delete"), shortcut: "d", action, permission: "offers:manage" },
 * ])
 * ```
 */
export const usePermittedCommands = <TCommand>(
  commands: PermissionedCommand<TCommand>[]
): TCommand[] => {
  const context = useContext(PermissionsContext)

  return useMemo(
    () => filterCommandsByPermission(commands, context),
    [commands, context]
  )
}
