import { Button, DropdownMenu } from "@medusajs/ui"
import { EllipsisHorizontal } from "@medusajs/icons"
import { useState } from "react";

export const ActionsButton = ({actions}: {actions: {label: string, onClick: () => void, icon?: JSX.Element}[]}) => {
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild><Button variant="transparent" className="h-8 w-12 p-0" onClick={() => setOpen(true)}><EllipsisHorizontal /></Button></DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {actions.map(({ label, onClick, icon}) => (
          <DropdownMenu.Item key={label} onClick={onClick} className="flex items-center gap-2">
            {icon}{label}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu>
  )
}