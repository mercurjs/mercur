import { DropdownMenu } from "@medusajs/ui";
import { EllipsisHorizontal, Eye } from "@medusajs/icons";
import { AdminOrderReturnRequest } from "../types";

type Props = {
  handleDetail: (request: AdminOrderReturnRequest) => void;
  request: AdminOrderReturnRequest;
};

export function ReturnRequestMenu({ handleDetail, request }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <EllipsisHorizontal />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item
          className="gap-x-2"
          onClick={() => {
            handleDetail(request);
          }}
        >
          <Eye className="text-ui-fg-subtle" />
          Review
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}
