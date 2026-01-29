import { useState } from "react";

import { EllipsisHorizontal } from "@medusajs/icons";
import { Button, DropdownMenu } from "@medusajs/ui";

export const ActionsButton = ({
  actions,
  "data-testid": dataTestId,
}: {
  actions: { label: string; onClick: () => void; icon?: JSX.Element }[];
  "data-testid"?: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenu open={open} onOpenChange={setOpen} data-testid={dataTestId}>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="transparent"
          className="h-8 w-12 p-0"
          onClick={() => setOpen(true)}
          data-testid={dataTestId ? `${dataTestId}-trigger` : undefined}
        >
          <EllipsisHorizontal />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        data-testid={dataTestId ? `${dataTestId}-content` : undefined}
      >
        {actions.map(({ label, onClick, icon }, index) => (
          <DropdownMenu.Item
            key={label}
            onClick={onClick}
            className="flex items-center gap-2"
            data-testid={
              dataTestId
                ? `${dataTestId}-action-${index}-${label.toLowerCase().replace(/\s+/g, "-")}`
                : undefined
            }
          >
            {icon}
            {label}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu>
  );
};
