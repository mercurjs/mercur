import { useState } from "react";

import { InformationCircle } from "@medusajs/icons";
import { Button, Container, Drawer, Text } from "@medusajs/ui";

import { formatDate } from "@lib/date";

import type { AdminRequest } from "@custom-types/requests";
import type { ReviewRemoveRequest } from "@custom-types/requests";

import { useReview } from "@hooks/api/reviews";

import { ResolveRequestPrompt } from "@pages/requests/common/components/resolve-request";

type Props = {
  request?: AdminRequest;
  open: boolean;
  close: () => void;
};

export function ReviewRemoveRequestDetail({ request, open, close }: Props) {
  if (!request) {
    return null;
  }
  const requestData = request as ReviewRemoveRequest;

  const [promptOpen, setPromptOpen] = useState(false);
  const [requestAccept, setRequestAccept] = useState(false);

  const { review } = useReview(requestData.data.review_id!);

  const handlePrompt = (_: string, accept: boolean) => {
    setRequestAccept(accept);
    setPromptOpen(true);
  };

  return (
    <Drawer open={open} onOpenChange={close} data-testid={`review-remove-detail-${request.id}`}>
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
      <Drawer.Content data-testid={`review-remove-detail-${request.id}-content`}>
        <Drawer.Header data-testid={`review-remove-detail-${request.id}-header`}>
          <Drawer.Title data-testid={`review-remove-detail-${request.id}-title`}>Remove review request</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="p-4" data-testid={`review-remove-detail-${request.id}-body`}>
          <fieldset data-testid={`review-remove-detail-${request.id}-seller-fieldset`}>
            <legend className="mb-2" data-testid={`review-remove-detail-${request.id}-seller-legend`}>Seller</legend>
            <Container data-testid={`review-remove-detail-${request.id}-seller-container`}>
              <Text data-testid={`review-remove-detail-${request.id}-seller-value`}>{request.seller?.name}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2" data-testid={`review-remove-detail-${request.id}-review-note-fieldset`}>
            <legend className="mb-2" data-testid={`review-remove-detail-${request.id}-review-note-legend`}>Review note</legend>
            <Container data-testid={`review-remove-detail-${request.id}-review-note-container`}>
              <Text data-testid={`review-remove-detail-${request.id}-review-note-value`}>{review?.customer_note}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2" data-testid={`review-remove-detail-${request.id}-rating-fieldset`}>
            <legend className="mb-2" data-testid={`review-remove-detail-${request.id}-rating-legend`}>Review rating</legend>
            <Container data-testid={`review-remove-detail-${request.id}-rating-container`}>
              <Text data-testid={`review-remove-detail-${request.id}-rating-value`}>{review?.rating}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2" data-testid={`review-remove-detail-${request.id}-seller-response-fieldset`}>
            <legend className="mb-2" data-testid={`review-remove-detail-${request.id}-seller-response-legend`}>Seller response</legend>
            <Container data-testid={`review-remove-detail-${request.id}-seller-response-container`}>
              <Text data-testid={`review-remove-detail-${request.id}-seller-response-value`}>{review?.seller_note}</Text>
            </Container>
          </fieldset>
          <Container className="mt-4" data-testid={`review-remove-detail-${request.id}-request-information`}>
            <div className="flex items-center gap-2" data-testid={`review-remove-detail-${request.id}-request-information-header`}>
              <InformationCircle />
              <Text className="font-semibold" data-testid={`review-remove-detail-${request.id}-request-information-title`}>Request information</Text>
            </div>
            <Text data-testid={`review-remove-detail-${request.id}-submitted-on`}>{`Submitted on ${formatDate(request.created_at)}`}</Text>
            {request.reviewer_id && (
              <Text data-testid={`review-remove-detail-${request.id}-reviewed-on`}>{`Reviewed on ${formatDate(request.updated_at)}`}</Text>
            )}
            {request.reviewer_note && (
              <Text data-testid={`review-remove-detail-${request.id}-reviewer-note`}>{`Reviewer note: ${request.reviewer_note}`}</Text>
            )}
          </Container>
        </Drawer.Body>
        <Drawer.Footer data-testid={`review-remove-detail-${request.id}-footer`}>
          {request.status === "pending" && (
            <>
              <Button
                onClick={() => {
                  handlePrompt(request.id!, true);
                }}
                data-testid={`review-remove-detail-${request.id}-accept-button`}
              >
                Accept
              </Button>
              <Button
                onClick={() => {
                  handlePrompt(request.id!, false);
                }}
                variant="danger"
                data-testid={`review-remove-detail-${request.id}-reject-button`}
              >
                Reject
              </Button>
              <Button variant="secondary" onClick={close} data-testid={`review-remove-detail-${request.id}-cancel-button`}>
                Cancel
              </Button>
            </>
          )}
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
}
