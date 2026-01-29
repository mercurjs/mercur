import { EllipsisHorizontal, Eye } from "@medusajs/icons";
import { DropdownMenu } from "@medusajs/ui";

import type { AdminRequest } from "@custom-types/requests";

type Props = {
  handleDetail: (request: AdminRequest) => void;
  request: AdminRequest;
};

export function RequestMenu({ handleDetail, request }: Props) {
  return (
    <DropdownMenu data-testid={`request-menu-${request.id}`}>
      <DropdownMenu.Trigger asChild>
        <div data-testid={`request-menu-${request.id}-trigger`}>
          <EllipsisHorizontal />
        </div>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content data-testid={`request-menu-${request.id}-content`}>
        <DropdownMenu.Item
          className="gap-x-2"
          onClick={() => {
            handleDetail(request);
          }}
          data-testid={`request-menu-${request.id}-action-review`}
        >
          <Eye className="text-ui-fg-subtle" />
          Review
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}
