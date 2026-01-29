import { useState } from "react";

import { InformationCircle } from "@medusajs/icons";
import type { ProductTagDTO } from "@medusajs/types";
import { Button, Container, Drawer, Text } from "@medusajs/ui";

import type { AdminRequest } from "@custom-types/requests";

import { formatDate } from "@lib/date";

import { ResolveRequestPrompt } from "@pages/requests/common/components/resolve-request";

type Props = {
  request?: AdminRequest;
  open: boolean;
  close: () => void;
};

export function ProductTagRequestDetail({ request, open, close }: Props) {
  if (!request) {
    return null;
  }
  const requestData = request.data as ProductTagDTO;

  const [promptOpen, setPromptOpen] = useState(false);
  const [requestAccept, setRequestAccept] = useState(false);

  const handlePrompt = (_: string, accept: boolean) => {
    setRequestAccept(accept);
    setPromptOpen(true);
  };

  return (
    <Drawer
      open={open}
      onOpenChange={close}
      data-testid={`product-tag-detail-${request.id}`}
    >
      <ResolveRequestPrompt
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
      <Drawer.Content data-testid={`product-tag-detail-${request.id}-content`}>
        <Drawer.Header data-testid={`product-tag-detail-${request.id}-header`}>
          <Drawer.Title data-testid={`product-tag-detail-${request.id}-title`}>
            Product tag request
          </Drawer.Title>
        </Drawer.Header>
        <Drawer.Body
          className="p-4"
          data-testid={`product-tag-detail-${request.id}-body`}
        >
          <fieldset
            data-testid={`product-tag-detail-${request.id}-value-fieldset`}
          >
            <legend
              className="mb-2"
              data-testid={`product-tag-detail-${request.id}-value-legend`}
            >
              Product tag value
            </legend>
            <Container
              data-testid={`product-tag-detail-${request.id}-value-container`}
            >
              <Text
                data-testid={`product-tag-detail-${request.id}-value-value`}
              >
                {requestData.value}
              </Text>
            </Container>
          </fieldset>
          <fieldset
            className="mt-2"
            data-testid={`product-tag-detail-${request.id}-submitted-by-fieldset`}
          >
            <legend
              className="mb-2"
              data-testid={`product-tag-detail-${request.id}-submitted-by-legend`}
            >
              Submitted by
            </legend>
            <Container
              data-testid={`product-tag-detail-${request.id}-submitted-by-container`}
            >
              <Text
                data-testid={`product-tag-detail-${request.id}-submitted-by-value`}
              >
                {request.seller?.name}
              </Text>
            </Container>
          </fieldset>
          <Container
            className="mt-4"
            data-testid={`product-tag-detail-${request.id}-request-information`}
          >
            <div
              className="flex items-center gap-2"
              data-testid={`product-tag-detail-${request.id}-request-information-header`}
            >
              <InformationCircle />
              <Text
                className="font-semibold"
                data-testid={`product-tag-detail-${request.id}-request-information-title`}
              >
                Request information
              </Text>
            </div>
            <Text
              data-testid={`product-tag-detail-${request.id}-submitted-on`}
            >{`Submitted on ${formatDate(request.created_at)}`}</Text>
            {request.reviewer_id && (
              <Text
                data-testid={`product-tag-detail-${request.id}-reviewed-on`}
              >{`Reviewed on ${formatDate(request.updated_at)}`}</Text>
            )}
            {request.reviewer_note && (
              <Text
                data-testid={`product-tag-detail-${request.id}-reviewer-note`}
              >{`Reviewer note: ${request.reviewer_note}`}</Text>
            )}
          </Container>
        </Drawer.Body>
        <Drawer.Footer data-testid={`product-tag-detail-${request.id}-footer`}>
          {request.status === "pending" && (
            <>
              <Button
                onClick={() => {
                  handlePrompt(request.id!, true);
                }}
                data-testid={`product-tag-detail-${request.id}-accept-button`}
              >
                Accept
              </Button>
              <Button
                onClick={() => {
                  handlePrompt(request.id!, false);
                }}
                variant="danger"
                data-testid={`product-tag-detail-${request.id}-reject-button`}
              >
                Reject
              </Button>
              <Button
                variant="secondary"
                onClick={close}
                data-testid={`product-tag-detail-${request.id}-cancel-button`}
              >
                Cancel
              </Button>
            </>
          )}
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
}
