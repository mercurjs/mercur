import type { PropsWithChildren, ReactNode } from "react";

import { EllipsisHorizontal } from "@medusajs/icons";
import { DropdownMenu, IconButton, clx } from "@medusajs/ui";

import { Link } from "react-router-dom";

import { ConditionalTooltip } from "@components/common/conditional-tooltip";

import { useDocumentDirection } from "@hooks/use-document-direction";

export type Action = {
  icon: ReactNode;
  label: string;
  disabled?: boolean;
  /**
   * Optional tooltip to display when a disabled action is hovered.
   */
  disabledTooltip?: string | ReactNode;
} & (
  | {
      to: string;
      onClick?: never;
    }
  | {
      onClick: () => void;
      to?: never;
    }
);

export type ActionGroup = {
  actions: Action[];
};

type ActionMenuProps = PropsWithChildren<{
  groups: ActionGroup[];
  variant?: "transparent" | "primary";
}>;

export const ActionMenu = ({
  groups,
  variant = "transparent",
  children,
  "data-testid": dataTestId,
}: ActionMenuProps & { "data-testid"?: string }) => {
  const direction = useDocumentDirection();
  const inner = children ?? (
    <IconButton size="small" variant={variant} data-testid={dataTestId ? `${dataTestId}-trigger` : undefined}>
      <EllipsisHorizontal />
    </IconButton>
  );

  return (
    <DropdownMenu dir={direction} data-testid={dataTestId}>
      <DropdownMenu.Trigger asChild>{inner}</DropdownMenu.Trigger>
      <DropdownMenu.Content data-testid={dataTestId ? `${dataTestId}-content` : undefined}>
        {groups.map((group, index) => {
          if (!group.actions.length) {
            return null;
          }

          const isLast = index === groups.length - 1;

          return (
            <DropdownMenu.Group key={index} data-testid={dataTestId ? `${dataTestId}-group-${index}` : undefined}>
              {group.actions.map((action, actionIndex) => {
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
                  : "div";

                if (action.onClick) {
                  return (
                    <Wrapper key={actionIndex}>
                      <DropdownMenu.Item
                        disabled={action.disabled}
                        onClick={(e) => {
                          e.stopPropagation();
                          action.onClick();
                        }}
                        className={clx(
                          "flex items-center gap-x-2 [&_svg]:text-ui-fg-subtle",
                          {
                            "[&_svg]:text-ui-fg-disabled": action.disabled,
                          },
                        )}
                        data-testid={dataTestId ? `${dataTestId}-action-${actionIndex}-${action.label.toLowerCase().replace(/\s+/g, "-")}` : undefined}
                      >
                        {action.icon}
                        <span>{action.label}</span>
                      </DropdownMenu.Item>
                    </Wrapper>
                  );
                }

                return (
                  <Wrapper key={actionIndex}>
                    <DropdownMenu.Item
                      className={clx(
                        "flex items-center gap-x-2 [&_svg]:text-ui-fg-subtle",
                        {
                          "[&_svg]:text-ui-fg-disabled": action.disabled,
                        },
                      )}
                      asChild
                      disabled={action.disabled}
                      data-testid={dataTestId ? `${dataTestId}-action-${actionIndex}-${action.label.toLowerCase().replace(/\s+/g, "-")}` : undefined}
                    >
                      <Link to={action.to} onClick={(e) => e.stopPropagation()}>
                        {action.icon}
                        <span>{action.label}</span>
                      </Link>
                    </DropdownMenu.Item>
                  </Wrapper>
                );
              })}
              {!isLast && <DropdownMenu.Separator />}
            </DropdownMenu.Group>
          );
        })}
      </DropdownMenu.Content>
    </DropdownMenu>
  );
};
