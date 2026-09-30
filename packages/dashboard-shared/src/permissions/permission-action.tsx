import { Tooltip } from "@medusajs/ui"
import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react"
import type { Permission } from "@mercurjs/dashboard-sdk"
import { usePermissionGate } from "./use-permission-gate"

type ActionElementProps = {
  disabled?: boolean
  asChild?: boolean
  children?: ReactNode
}

export type PermissionActionProps = {
  permission: Permission | Permission[]
  /** When several permissions are given, require all of them. Defaults to any. */
  requireAll?: boolean
  children: ReactElement<ActionElementProps>
}

/**
 * Disables a button (or a button wrapping a link) with a tooltip when the
 * actor lacks the permission of the endpoint it calls.
 *
 * @example
 * ```tsx
 * <PermissionAction permission="products:edit">
 *   <Button size="small" variant="secondary" asChild>
 *     <Link to="create">Create</Link>
 *   </Button>
 * </PermissionAction>
 * ```
 */
export const PermissionAction = ({
  permission,
  requireAll = false,
  children,
}: PermissionActionProps) => {
  const gate = usePermissionGate(permission, requireAll)

  if (gate.allowed) {
    return children
  }

  // A disabled `asChild` button would still render a live link, so the link is
  // unwrapped and only its label kept.
  const inner = children.props.children
  const label =
    children.props.asChild && isValidElement<{ children?: ReactNode }>(inner)
      ? inner.props.children
      : inner

  return (
    <Tooltip content={gate.tooltip}>
      <span className="inline-flex">
        {cloneElement(children, { disabled: true, asChild: false }, label)}
      </span>
    </Tooltip>
  )
}
