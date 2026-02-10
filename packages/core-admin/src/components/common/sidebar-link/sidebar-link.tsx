import { ReactNode } from "react"
import { Link } from "react-router-dom"

import { TriangleRightMini } from "@medusajs/icons"
import { Text } from "@medusajs/ui"
import { IconAvatar } from "../icon-avatar"

export interface SidebarLinkProps {
  to: string
  labelKey: string
  descriptionKey: string
  icon: ReactNode
  "data-testid"?: string
}

export const SidebarLink = ({
  to,
  labelKey,
  descriptionKey,
  icon,
  "data-testid": dataTestId,
}: SidebarLinkProps) => {
  return (
    <Link to={to} className="group outline-none" data-testid={dataTestId}>
      <div className="flex flex-col gap-2 px-2 pb-2" data-testid={dataTestId ? `${dataTestId}-container` : undefined}>
        <div className="shadow-elevation-card-rest bg-ui-bg-component transition-fg hover:bg-ui-bg-component-hover active:bg-ui-bg-component-pressed group-focus-visible:shadow-borders-interactive-with-active rounded-md px-4 py-2" data-testid={dataTestId ? `${dataTestId}-card` : undefined}>
          <div className="flex items-center gap-4">
            <IconAvatar data-testid={dataTestId ? `${dataTestId}-icon` : undefined}>{icon}</IconAvatar>
            <div className="flex flex-1 flex-col" data-testid={dataTestId ? `${dataTestId}-text-container` : undefined}>
              <Text size="small" leading="compact" weight="plus" data-testid={dataTestId ? `${dataTestId}-label` : undefined}>
                {labelKey}
              </Text>
              <Text
                size="small"
                leading="compact"
                className="text-ui-fg-subtle"
                data-testid={dataTestId ? `${dataTestId}-description` : undefined}
              >
                {descriptionKey}
              </Text>
            </div>
            <div className="flex size-7 items-center justify-center" data-testid={dataTestId ? `${dataTestId}-arrow` : undefined}>
              <TriangleRightMini className="text-ui-fg-muted rtl:rotate-180" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
