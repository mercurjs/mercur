import { Button, Container, Drawer, Text } from "@medusajs/ui";
import { InformationCircle } from "@medusajs/icons";
import { AdminRequest, ReviewRemoveRequest } from "@mercurjs/http-client";
import { useState } from "react";
import { formatDate } from "../../../lib/date";
import { ResolveRequestPrompt } from "../components/resolve-request";
import { useReview } from "../../../hooks/api/reviews";

type Props = {
  request?: AdminRequest;
  open: boolean;
  close: () => void;
};

export function ReviewRemoveRequestDetail({
  request,
  open,
  close,
}: Props) {
  if (!request) {
    return null;
  }
  const requestData = request as ReviewRemoveRequest;

  const [promptOpen, setPromptOpen] = useState(false);
  const [requestAccept, setRequestAccept] = useState(false);

  const { review } = useReview(requestData.data.review_id!)

  const handlePrompt = (_: string, accept: boolean) => {
    setRequestAccept(accept);
    setPromptOpen(true);
  };

  return (
    <Drawer open={open} onOpenChange={close}>
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
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Remove review request</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="p-4">
          <fieldset>
            <legend className="mb-2">Seller</legend>
            <Container>
              <Text>{request.seller?.name}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2">
            <legend className="mb-2">Review note</legend>
            <Container>
              <Text>{review?.customer_note}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2">
            <legend className="mb-2">Review rating</legend>
            <Container>
              <Text>{review?.rating}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2">
            <legend className="mb-2">Seller response</legend>
            <Container>
              <Text>{review?.seller_note}</Text>
            </Container>
          </fieldset>
          <Container className="mt-4 bg-gray-200">
            <div className="flex items-center gap-2">
              <InformationCircle />
              <Text className="font-semibold">Request information</Text>
            </div>
            <Text>{`Submitted on ${formatDate(request.created_at)}`}</Text>
          </Container>
        </Drawer.Body>
        <Drawer.Footer>
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
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
}
