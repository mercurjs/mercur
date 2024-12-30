import { PropsWithChildren, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from './button'
import { Ellipsis } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from './dropdown-menu'
import { cn } from '../lib'

export type Action = {
  icon: ReactNode
  label: string
  disabled?: boolean
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
}>

export const ActionMenu = ({ groups, children }: ActionMenuProps) => {
  const inner = children ?? (
    <Button size="icon" variant="ghost">
      <Ellipsis className="h-4 w-4 text-muted-foreground" />
    </Button>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{inner}</DropdownMenuTrigger>
      <DropdownMenuContent>
        {groups.map((group, index) => {
          if (!group.actions.length) {
            return null
          }

          const isLast = index === groups.length - 1

          return (
            <DropdownMenuGroup key={index}>
              {group.actions.map((action) => {
                if (action.onClick) {
                  return (
                    <DropdownMenuItem
                      disabled={action.disabled}
                      onClick={(e) => {
                        e.stopPropagation()
                        action.onClick()
                      }}
                      className={cn(
                        '[&_svg]:text-ui-fg-subtle flex items-center gap-x-2',
                        {
                          '[&_svg]:text-ui-fg-disabled': action.disabled
                        }
                      )}
                    >
                      {action.icon}
                      <span>{action.label}</span>
                    </DropdownMenuItem>
                  )
                }

                return (
                  <DropdownMenuItem
                    className={cn(
                      '[&_svg]:text-ui-fg-subtle flex items-center gap-x-2',
                      {
                        '[&_svg]:text-ui-fg-disabled': action.disabled
                      }
                    )}
                    asChild
                    disabled={action.disabled}
                  >
                    <Link to={action.to} onClick={(e) => e.stopPropagation()}>
                      {action.icon}
                      <span>{action.label}</span>
                    </Link>
                  </DropdownMenuItem>
                )
              })}
              {!isLast && <DropdownMenuSeparator />}
            </DropdownMenuGroup>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
