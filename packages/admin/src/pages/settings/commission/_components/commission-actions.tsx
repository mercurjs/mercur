import { EllipsisHorizontal, PencilSquare, Trash } from "@medusajs/icons";
import { DropdownMenu, toast } from "@medusajs/ui";

import {
  useDeleteCommisionRule,
  useUpdateCommisionRule,
} from "@hooks/api/commission";

export function CommissionActionMenu({
  id,
  is_active,
  onSuccess,
}: {
  id: string;
  is_active: boolean;
  onSuccess?: () => void;
}) {
  const { mutateAsync: deleteCommissionRule } = useDeleteCommisionRule({});
  const { mutateAsync: updateCommissionRule } = useUpdateCommisionRule({});

  const onDeleteClick = async () => {
    try {
      await deleteCommissionRule({ id });
      toast.success("Deleted!");
      onSuccess?.();
    } catch {
      toast.error("Error!");
    }
  };

  const onSwitchEnableClick = async () => {
    try {
      await updateCommissionRule({ id, is_active: !is_active });
      toast.success("Updated!");
      onSuccess?.();
    } catch {
      toast.error("Error!");
    }
  };

  return (
    <DropdownMenu data-testid={`commission-rule-action-menu-${id}`}>
      <DropdownMenu.Trigger asChild data-testid={`commission-rule-action-menu-${id}-trigger`}>
        <EllipsisHorizontal />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content data-testid={`commission-rule-action-menu-${id}-content`}>
        <DropdownMenu.Item className="gap-x-2" onClick={onSwitchEnableClick} data-testid={`commission-rule-action-menu-${id}-${is_active ? "disable" : "enable"}`}>
          <PencilSquare className="text-ui-fg-subtle" />
          {is_active ? "Disable" : "Enable"}
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item className="gap-x-2" onClick={onDeleteClick} data-testid={`commission-rule-action-menu-${id}-delete`}>
          <Trash className="text-ui-fg-subtle" />
          Delete
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}
