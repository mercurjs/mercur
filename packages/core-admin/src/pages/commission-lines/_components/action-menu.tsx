import { EllipsisHorizontal, Eye } from "@medusajs/icons";
import { DropdownMenu } from "@medusajs/ui";

import type { CommissionLine } from "@custom-types/commission";

type Props = {
  handleDetail: (line: CommissionLine) => void;
  line: CommissionLine;
};

export function ActionMenu({ handleDetail, line }: Props) {
  return (
    <DropdownMenu data-testid={`commission-lines-action-menu-${line.id}`}>
      <DropdownMenu.Trigger asChild data-testid={`commission-lines-action-menu-${line.id}-trigger`}>
        <EllipsisHorizontal />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content data-testid={`commission-lines-action-menu-${line.id}-content`}>
        <DropdownMenu.Item
          className="gap-x-2"
          onClick={() => {
            handleDetail(line);
          }}
          data-testid={`commission-lines-action-menu-${line.id}-see-details`}
        >
          <Eye className="text-ui-fg-subtle" />
          See details
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}
