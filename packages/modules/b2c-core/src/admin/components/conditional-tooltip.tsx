import { Tooltip, TooltipProvider } from "@medusajs/ui";
import { ComponentPropsWithoutRef, PropsWithChildren } from "react";

type ConditionalTooltipProps = PropsWithChildren<
  ComponentPropsWithoutRef<typeof Tooltip> & {
    showTooltip?: boolean;
  }
>;

export const ConditionalTooltip = ({
  children,
  showTooltip = false,
  ...props
}: ConditionalTooltipProps) => {
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip {...props}>{children}</Tooltip>
      </TooltipProvider>
    );
  }

  return children;
};
