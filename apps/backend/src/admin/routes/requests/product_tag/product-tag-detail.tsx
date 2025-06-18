import { Button, Container, Drawer, Text } from "@medusajs/ui";
import { InformationCircle } from "@medusajs/icons";
import { useState } from "react";
import { formatDate } from "../../../lib/date";
import { ProductTagDTO} from "@medusajs/framework/types";
import { ResolveRequestPrompt } from "../components/resolve-request";
import { AdminRequest } from "../types";

type Props = {
  request?: AdminRequest;
  open: boolean;
  close: () => void;
};

export function ProductTagRequestDetail({
  request,
  open,
  close,
}: Props) {
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
          <Drawer.Title>Product tag request</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="p-4">
          <fieldset>
            <legend className="mb-2">Product tag value</legend>
            <Container>
              <Text>{requestData.value}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2">
            <legend className="mb-2">Submitted by</legend>
            <Container>
              <Text>{request.seller?.name}</Text>
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
