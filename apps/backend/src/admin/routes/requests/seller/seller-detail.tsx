import { Button, Container, Drawer, Text } from "@medusajs/ui";
import { InformationCircle } from "@medusajs/icons";
import { useState } from "react";
import { formatDate } from "../../../lib/date";
import { ResolveRequestPrompt } from "../components/resolve-request";
import { AdminRequest } from "../types";

type Props = {
  request?: AdminRequest;
  open: boolean;
  close: () => void;
};

export function SellerRequestDetail({ request, open, close }: Props) {
  if (!request) {
    return null;
  }
  const requestData = request.data as any;

  const [promptOpen, setPromptOpen] = useState(false);
  const [requestAccept, setRequestAccept] = useState(false);

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
          <Drawer.Title>Review seller request</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="p-4">
          <fieldset>
            <legend className="mb-2">Seller name</legend>
            <Container>
              <Text>{requestData.seller.name}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2">
            <legend className="mb-2">Member</legend>
            <Container>
              <Text>{`${requestData.member.name}`}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2">
            <legend className="mb-2">Email</legend>
            <Container>
              <Text>{requestData.provider_identity_id}</Text>
            </Container>
          </fieldset>
          <Container className="mt-4">
            <div className="flex items-center gap-2">
              <InformationCircle />
              <Text className="font-semibold">Request information</Text>
            </div>
            <Text>{`Submitted on ${formatDate(request.created_at)}`}</Text>
            {request.reviewer_id && <Text>{`Reviewed on ${formatDate(request.updated_at)}`}</Text>}
            {request.reviewer_note &&
              <Text>{`Reviewer note: ${request.reviewer_note}`}</Text>
            }
          </Container>
        </Drawer.Body>
        <Drawer.Footer>
          {request.status === 'pending' && <>
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
