import { useState } from "react";

import { InformationCircle } from "@medusajs/icons";
import type { OrderDTO } from "@medusajs/types";
import { Button, Container, Drawer, Text } from "@medusajs/ui";

import { formatDate } from "@lib/date";

import type { AdminOrderReturnRequest } from "@custom-types/requests";

import { useOrder } from "@hooks/api";

import { ResolveReturnRequestPrompt } from "@pages/requests/common/components/resolve-return-request";

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
    <Drawer open={open} onOpenChange={close} data-testid={`return-request-detail-${request.id}`}>
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
      <Drawer.Content data-testid={`return-request-detail-${request.id}-content`}>
        <Drawer.Header data-testid={`return-request-detail-${request.id}-header`}>
          <Drawer.Title data-testid={`return-request-detail-${request.id}-title`}>Order return request</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="flex max-w-full flex-1 flex-col overflow-y-auto" data-testid={`return-request-detail-${request.id}-body`}>
          <fieldset data-testid={`return-request-detail-${request.id}-order-id-fieldset`}>
            <legend className="mb-2" data-testid={`return-request-detail-${request.id}-order-id-legend`}>Order ID</legend>
            <Container data-testid={`return-request-detail-${request.id}-order-id-container`}>
              <Text data-testid={`return-request-detail-${request.id}-order-id-value`}>{request.order?.id}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2" data-testid={`return-request-detail-${request.id}-customer-fieldset`}>
            <legend className="mb-2" data-testid={`return-request-detail-${request.id}-customer-legend`}>Customer</legend>
            <Container data-testid={`return-request-detail-${request.id}-customer-container`}>
              <Text data-testid={`return-request-detail-${request.id}-customer-value`}>{`${request.order?.customer?.first_name} ${request.order?.customer?.last_name}`}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2" data-testid={`return-request-detail-${request.id}-seller-fieldset`}>
            <legend className="mb-2" data-testid={`return-request-detail-${request.id}-seller-legend`}>Seller</legend>
            <Container data-testid={`return-request-detail-${request.id}-seller-container`}>
              <Text data-testid={`return-request-detail-${request.id}-seller-value`}>{request.seller?.name}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2" data-testid={`return-request-detail-${request.id}-reason-fieldset`}>
            <legend className="mb-2" data-testid={`return-request-detail-${request.id}-reason-legend`}>Return request reason</legend>
            <Container data-testid={`return-request-detail-${request.id}-reason-container`}>
              <Text data-testid={`return-request-detail-${request.id}-reason-value`}>{request.customer_note}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2" data-testid={`return-request-detail-${request.id}-vendor-response-fieldset`}>
            <legend className="mb-2" data-testid={`return-request-detail-${request.id}-vendor-response-legend`}>Vendor response</legend>
            <Container data-testid={`return-request-detail-${request.id}-vendor-response-container`}>
              <Text data-testid={`return-request-detail-${request.id}-vendor-response-value`}>{request.vendor_reviewer_note || "-"}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2" data-testid={`return-request-detail-${request.id}-items-fieldset`}>
            <legend className="mb-2" data-testid={`return-request-detail-${request.id}-items-legend`}>Items</legend>
            <Container data-testid={`return-request-detail-${request.id}-items-container`}>
              {request.line_items?.map((item) => {
                return (
                  <ItemRow
                    order={order!}
                    line_item_id={item.line_item_id!}
                    quantity={item.quantity!}
                    key={item.id}
                  />
                );
              })}
            </Container>
          </fieldset>
          <Container className="mt-4" data-testid={`return-request-detail-${request.id}-request-information`}>
            <div className="flex items-center gap-2" data-testid={`return-request-detail-${request.id}-request-information-header`}>
              <InformationCircle />
              <Text className="font-semibold" data-testid={`return-request-detail-${request.id}-request-information-title`}>Request information</Text>
            </div>
            <Text data-testid={`return-request-detail-${request.id}-submitted-on`}>{`Submitted on ${formatDate(request.created_at)}`}</Text>
            <Text data-testid={`return-request-detail-${request.id}-escalated-on`}>{`Escalated on ${formatDate(request.vendor_reviewer_date)}`}</Text>
            {request.admin_reviewer_id && (
              <Text data-testid={`return-request-detail-${request.id}-reviewed-on`}>{`Reviewed on ${formatDate(request.admin_reviewer_date)}`}</Text>
            )}
            {request.admin_reviewer_note && (
              <Text data-testid={`return-request-detail-${request.id}-reviewer-note`}>{`Reviewer note: ${request.admin_reviewer_note}`}</Text>
            )}
          </Container>
        </Drawer.Body>
        <Drawer.Footer data-testid={`return-request-detail-${request.id}-footer`}>
          {request.status === "pending" ||
            (request.status === "escalated" && (
              <>
                <Button
                  onClick={() => {
                    handlePrompt(request.id!, true);
                  }}
                  data-testid={`return-request-detail-${request.id}-accept-button`}
                >
                  Accept
                </Button>
                <Button
                  onClick={() => {
                    handlePrompt(request.id!, false);
                  }}
                  variant="danger"
                  data-testid={`return-request-detail-${request.id}-reject-button`}
                >
                  Reject
                </Button>
                <Button variant="secondary" onClick={close} data-testid={`return-request-detail-${request.id}-cancel-button`}>
                  Cancel
                </Button>
              </>
            ))}
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
  order: OrderDTO;
  line_item_id: string;
  quantity: number;
}) => {
  const item = order?.items?.find((i) => i.id === line_item_id);

  return (
    <>
      <Text>
        {`${quantity}x ${item?.product_title} ${item?.variant_title || "-"}`}
      </Text>
    </>
  );
};
