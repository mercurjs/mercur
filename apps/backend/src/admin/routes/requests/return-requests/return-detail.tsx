import { Button, Container, Drawer, Text } from "@medusajs/ui";
import { InformationCircle } from "@medusajs/icons";

import { useState } from "react";
import { formatDate } from "../../../lib/date";
import { useOrder } from "../../../hooks/api/order";
import { ResolveReturnRequestPrompt } from "../components/resolve-return-request";
import { AdminOrderReturnRequest } from "../types";

type Props = {
  request?: AdminOrderReturnRequest;
  open: boolean;
  close: () => void;
};

export function ReturnRequestDetail({ request, open, close }: Props) {
  if (!request || !request.order?.id) {
    return null;
  }

  const { order } = useOrder(request.order?.id);

  const [promptOpen, setPromptOpen] = useState(false);
  const [requestAccept, setRequestAccept] = useState(false);

  const handlePrompt = (_: string, accept: boolean) => {
    setRequestAccept(accept);
    setPromptOpen(true);
  };

  return (
    <Drawer open={open} onOpenChange={close}>
      <ResolveReturnRequestPrompt
        close={() => {
          setPromptOpen(false);
        }}
        open={promptOpen}
        id={request.id!}
        accept={requestAccept}
        onSuccess={() => {
          close();
        }}
      />
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Order return request</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="flex max-w-full flex-1 flex-col overflow-y-auto">
          <fieldset>
            <legend className="mb-2">Order ID</legend>
            <Container>
              <Text>{request.order?.id}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2">
            <legend className="mb-2">Customer</legend>
            <Container>
              <Text>{`${request.order?.customer?.first_name} ${request.order?.customer?.last_name}`}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2">
            <legend className="mb-2">Seller</legend>
            <Container>
              <Text>{request.seller?.name}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2">
            <legend className="mb-2">Return request reason</legend>
            <Container>
              <Text>{request.customer_note}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2">
            <legend className="mb-2">Vendor response</legend>
            <Container>
              <Text>{request.vendor_reviewer_note || "-"}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2">
            <legend className="mb-2">Items</legend>
            <Container>
              {request.line_items?.map((item) => {
                return (
                  <ItemRow
                    order={order!}
                    line_item_id={item.line_item_id!}
                    quantity={item.quantity!}
                  />
                );
              })}
            </Container>
          </fieldset>
          <Container className="mt-4">
            <div className="flex items-center gap-2">
              <InformationCircle />
              <Text className="font-semibold">Request information</Text>
            </div>
            <Text>{`Submitted on ${formatDate(request.created_at)}`}</Text>
            <Text>{`Escalated on ${formatDate(request.vendor_reviewer_date)}`}</Text>
            {request.admin_reviewer_id && <Text>{`Reviewed on ${formatDate(request.admin_reviewer_date)}`}</Text>}
            {request.admin_reviewer_note &&
              <Text>{`Reviewer note: ${request.admin_reviewer_note}`}</Text>
            }
          </Container>
        </Drawer.Body>
        <Drawer.Footer>
          {request.status === 'pending' || request.status === 'escalated' && <>
            <Button
              onClick={() => {
                handlePrompt(request.id!, true);
              }}
            >
              Accept
            </Button>
            <Button
              onClick={() => {
                handlePrompt(request.id!, false);
              }}
              variant="danger"
            >
              Reject
            </Button>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
          </>}
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
}

const ItemRow = ({
  order,
  line_item_id,
  quantity,
}: {
  order: any;
  line_item_id: string;
  quantity: number;
}) => {
  const item = order?.items.find((i: any) => i.id === line_item_id);
  return (
    <>
      <Text>
        {`${quantity}x ${item?.product_title} ${item?.variant_title || "-"}`}
      </Text>
    </>
  );
};
