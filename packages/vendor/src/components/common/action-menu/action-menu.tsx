import { DropdownMenu, IconButton, clx } from "@medusajs/ui"

import { EllipsisHorizontal } from "@medusajs/icons"
import type { Permission } from "@mercurjs/dashboard-sdk"
import { PermissionsContext } from "@mercurjs/dashboard-shared"
import { filterActionGroups } from "./filter-action-groups"
import { PropsWithChildren, ReactNode, useContext, useMemo } from "react"
import { Link } from "react-router-dom"
import { ConditionalTooltip } from "../conditional-tooltip"
import { useDocumentDirection } from "../../../hooks/use-document-direction"

export type Action = {
  icon: ReactNode
  label: string
  disabled?: boolean
  /**
   * Optional tooltip to display when a disabled action is hovered.
   */
  disabledTooltip?: string | ReactNode
  /**
   * Permission(s) required to see this action. Omit for actions everyone with
   * access to the page may take. An action the actor can't perform is hidden
   * rather than disabled — the API would refuse it anyway, so offering it is
   * misleading.
   */
  permission?: Permission | Permission[]
  /** If true, ALL `permission` entries are required. Defaults to ANY. */
  requireAll?: boolean
} & (
  | {
      to: string
      onClick?: never
    }
  | {
      onClick: () => void
      to?: never
    }
)

export type ActionGroup = {
  actions: Action[]
}


type ActionMenuProps = PropsWithChildren<{
  groups: ActionGroup[]
  variant?: "transparent" | "primary"
}>

export const ActionMenu = ({
  groups,
  variant = "transparent",
  children,
}: ActionMenuProps) => {
  const direction = useDocumentDirection()
  // Read the context directly rather than through `usePermissions`, which
  // throws: this menu also renders on public routes that mount no provider.
  const permissions = useContext(PermissionsContext)

  const visibleGroups = useMemo(
    () => filterActionGroups(groups, permissions),
    [groups, permissions]
  )

  const inner = children ?? (
    <IconButton size="small" variant={variant}>
      <EllipsisHorizontal />
    </IconButton>
  )

  // Nothing the actor may do — don't render a menu that opens empty.
  if (!visibleGroups.length) {
    return null
  }

  return (
    <DropdownMenu dir={direction}>
      <DropdownMenu.Trigger asChild>{inner}</DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {visibleGroups.map((group, index) => {
          const isLast = index === visibleGroups.length - 1

          return (
            <DropdownMenu.Group key={index}>
              {group.actions.map((action, index) => {
                const Wrapper = action.disabledTooltip
                  ? ({ children }: { children: ReactNode }) => (
                      <ConditionalTooltip
                        showTooltip={action.disabled}
                        content={action.disabledTooltip}
                        side="right"
                      >
                        <div>{children}</div>
                      </ConditionalTooltip>
                    )
                  : "div"

                if (action.onClick) {
                  return (
                    <Wrapper key={index}>
                      <DropdownMenu.Item
                        disabled={action.disabled}
                        onClick={(e) => {
                          e.stopPropagation()
                          action.onClick()
                        }}
                        className={clx(
                          "[&_svg]:text-ui-fg-subtle flex items-center gap-x-2",
                          {
                            "[&_svg]:text-ui-fg-disabled": action.disabled,
                          }
                        )}
                      >
                        {action.icon}
                        <span>{action.label}</span>
                      </DropdownMenu.Item>
                    </Wrapper>
                  )
                }

                return (
                  <Wrapper key={index}>
                    <DropdownMenu.Item
                      className={clx(
                        "[&_svg]:text-ui-fg-subtle flex items-center gap-x-2",
                        {
                          "[&_svg]:text-ui-fg-disabled": action.disabled,
                        }
                      )}
                      asChild
                      disabled={action.disabled}
                    >
                      <Link to={action.to} onClick={(e) => e.stopPropagation()}>
                        {action.icon}
                        <span>{action.label}</span>
                      </Link>
                    </DropdownMenu.Item>
                  </Wrapper>
                )
              })}
              {!isLast && <DropdownMenu.Separator />}
            </DropdownMenu.Group>
          )
        })}
      </DropdownMenu.Content>
    </DropdownMenu>
  )
}
