import { useState } from "react";

import { InformationCircle } from "@medusajs/icons";
import { Button, Container, Drawer, Text } from "@medusajs/ui";

import type { AdminSellerRequest } from "@custom-types/requests";

import { formatDate } from "@lib/date";

import { ResolveRequestPrompt } from "@pages/requests/common/components/resolve-request";

type Props = {
  request?: AdminSellerRequest;
  open: boolean;
  close: () => void;
};

export function RequestSellerDetail({ request, open, close }: Props) {
  if (!request) {
    return null;
  }
  const requestData = request.data;

  const [promptOpen, setPromptOpen] = useState(false);
  const [requestAccept, setRequestAccept] = useState(false);

  const handlePrompt = (_: string, accept: boolean) => {
    setRequestAccept(accept);
    setPromptOpen(true);
  };

  return (
    <Drawer open={open} onOpenChange={close} data-testid={`request-seller-detail-${request.id}`}>
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
      <Drawer.Content data-testid={`request-seller-detail-${request.id}-content`}>
        <Drawer.Header data-testid={`request-seller-detail-${request.id}-header`}>
          <Drawer.Title data-testid={`request-seller-detail-${request.id}-title`}>Review seller request</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="p-4" data-testid={`request-seller-detail-${request.id}-body`}>
          <fieldset data-testid={`request-seller-detail-${request.id}-seller-name-fieldset`}>
            <legend className="mb-2" data-testid={`request-seller-detail-${request.id}-seller-name-legend`}>Seller name</legend>
            <Container data-testid={`request-seller-detail-${request.id}-seller-name-container`}>
              <Text data-testid={`request-seller-detail-${request.id}-seller-name-value`}>{requestData?.seller?.name ?? "-"}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2" data-testid={`request-seller-detail-${request.id}-member-fieldset`}>
            <legend className="mb-2" data-testid={`request-seller-detail-${request.id}-member-legend`}>Member</legend>
            <Container data-testid={`request-seller-detail-${request.id}-member-container`}>
              <Text data-testid={`request-seller-detail-${request.id}-member-value`}>{requestData?.member?.name ?? "-"}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2" data-testid={`request-seller-detail-${request.id}-email-fieldset`}>
            <legend className="mb-2" data-testid={`request-seller-detail-${request.id}-email-legend`}>Email</legend>
            <Container data-testid={`request-seller-detail-${request.id}-email-container`}>
              <Text data-testid={`request-seller-detail-${request.id}-email-value`}>{requestData?.provider_identity_id ?? "N/A"}</Text>
            </Container>
          </fieldset>
          <Container className="mt-4" data-testid={`request-seller-detail-${request.id}-request-information`}>
            <div className="flex items-center gap-2" data-testid={`request-seller-detail-${request.id}-request-information-header`}>
              <InformationCircle />
              <Text className="font-semibold" data-testid={`request-seller-detail-${request.id}-request-information-title`}>Request information</Text>
            </div>
            <Text data-testid={`request-seller-detail-${request.id}-submitted-on`}>{`Submitted on ${formatDate(request.created_at)}`}</Text>
            {request.reviewer_id && (
              <Text data-testid={`request-seller-detail-${request.id}-reviewed-on`}>{`Reviewed on ${formatDate(request.updated_at)}`}</Text>
            )}
            {request.reviewer_note && (
              <Text data-testid={`request-seller-detail-${request.id}-reviewer-note`}>{`Reviewer note: ${request.reviewer_note}`}</Text>
            )}
          </Container>
        </Drawer.Body>
        <Drawer.Footer data-testid={`request-seller-detail-${request.id}-footer`}>
          {request.status === "pending" && (
            <>
              <Button
                onClick={() => {
                  handlePrompt(request.id!, true);
                }}
                data-testid={`request-seller-detail-${request.id}-accept-button`}
              >
                Accept
              </Button>
              <Button
                onClick={() => {
                  handlePrompt(request.id!, false);
                }}
                variant="danger"
                data-testid={`request-seller-detail-${request.id}-reject-button`}
              >
                Reject
              </Button>
              <Button variant="secondary" onClick={close} data-testid={`request-seller-detail-${request.id}-cancel-button`}>
                Cancel
              </Button>
            </>
          )}
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
}
