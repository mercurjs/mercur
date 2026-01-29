import { useState } from "react";

import { InformationCircle } from "@medusajs/icons";
import type { ProductCategoryDTO } from "@medusajs/types";
import { Button, Container, Drawer, Text } from "@medusajs/ui";

import { formatDate } from "@lib/date";

import type { AdminRequest } from "@custom-types/requests";

import { ResolveRequestPrompt } from "@pages/requests/common/components/resolve-request";

type Props = {
  request?: AdminRequest;
  open: boolean;
  close: () => void;
};

export function ProductCategoryRequestDetail({ request, open, close }: Props) {
  if (!request) {
    return null;
  }
  const requestData = request.data as ProductCategoryDTO;

  const [promptOpen, setPromptOpen] = useState(false);
  const [requestAccept, setRequestAccept] = useState(false);

  const handlePrompt = (_: string, accept: boolean) => {
    setRequestAccept(accept);
    setPromptOpen(true);
  };

  return (
    <Drawer open={open} onOpenChange={close} data-testid={`product-category-detail-${request.id}`}>
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
      <Drawer.Content data-testid={`product-category-detail-${request.id}-content`}>
        <Drawer.Header data-testid={`product-category-detail-${request.id}-header`}>
          <Drawer.Title data-testid={`product-category-detail-${request.id}-title`}>Product category request</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="p-4" data-testid={`product-category-detail-${request.id}-body`}>
          <fieldset data-testid={`product-category-detail-${request.id}-name-fieldset`}>
            <legend className="mb-2" data-testid={`product-category-detail-${request.id}-name-legend`}>Category name</legend>
            <Container data-testid={`product-category-detail-${request.id}-name-container`}>
              <Text data-testid={`product-category-detail-${request.id}-name-value`}>{requestData.name}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2" data-testid={`product-category-detail-${request.id}-handle-fieldset`}>
            <legend className="mb-2" data-testid={`product-category-detail-${request.id}-handle-legend`}>Handle</legend>
            <Container data-testid={`product-category-detail-${request.id}-handle-container`}>
              <Text data-testid={`product-category-detail-${request.id}-handle-value`}>{`/${requestData.handle}`}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2" data-testid={`product-category-detail-${request.id}-submitted-by-fieldset`}>
            <legend className="mb-2" data-testid={`product-category-detail-${request.id}-submitted-by-legend`}>Submitted by</legend>
            <Container data-testid={`product-category-detail-${request.id}-submitted-by-container`}>
              <Text data-testid={`product-category-detail-${request.id}-submitted-by-value`}>{request.seller?.name}</Text>
            </Container>
          </fieldset>
          <Container className="mt-4" data-testid={`product-category-detail-${request.id}-request-information`}>
            <div className="flex items-center gap-2" data-testid={`product-category-detail-${request.id}-request-information-header`}>
              <InformationCircle />
              <Text className="font-semibold" data-testid={`product-category-detail-${request.id}-request-information-title`}>Request information</Text>
            </div>
            <Text data-testid={`product-category-detail-${request.id}-submitted-on`}>{`Submitted on ${formatDate(request.created_at)}`}</Text>
            {request.reviewer_id && (
              <Text data-testid={`product-category-detail-${request.id}-reviewed-on`}>{`Reviewed on ${formatDate(request.updated_at)}`}</Text>
            )}
            {request.reviewer_note && (
              <Text data-testid={`product-category-detail-${request.id}-reviewer-note`}>{`Reviewer note: ${request.reviewer_note}`}</Text>
            )}
          </Container>
        </Drawer.Body>
        <Drawer.Footer data-testid={`product-category-detail-${request.id}-footer`}>
          {request.status === "pending" && (
            <>
              <Button
                onClick={() => {
                  handlePrompt(request.id!, true);
                }}
                data-testid={`product-category-detail-${request.id}-accept-button`}
              >
                Accept
              </Button>
              <Button
                onClick={() => {
                  handlePrompt(request.id!, false);
                }}
                variant="danger"
                data-testid={`product-category-detail-${request.id}-reject-button`}
              >
                Reject
              </Button>
              <Button variant="secondary" onClick={close} data-testid={`product-category-detail-${request.id}-cancel-button`}>
                Cancel
              </Button>
            </>
          )}
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
}
