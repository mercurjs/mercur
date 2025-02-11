import { Button, Container, Drawer, Text } from "@medusajs/ui";
import { InformationCircle } from "@medusajs/icons";
import { AdminRequest } from "@mercurjs/http-client";
import { useState } from "react";
import { formatDate } from "../../../lib/date";
import { ProductCategoryDTO } from "@medusajs/framework/types";
import { useProductCategory } from "../../../hooks/api/product_category";
import { ResolveRequestPrompt } from "../components/resolve-request";

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

  let parent_category_name = "-";
  if (requestData.parent_category_id) {
    const { product_category } = useProductCategory(
      requestData.parent_category_id,
    );
    parent_category_name = product_category?.name || "-";
  }

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
          <Drawer.Title>Product category request</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="p-4">
          <fieldset>
            <legend className="mb-2">Category name</legend>
            <Container>
              <Text>{requestData.name}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2">
            <legend className="mb-2">Handle</legend>
            <Container>
              <Text>{`/${requestData.handle}`}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2">
            <legend className="mb-2">Submitted by</legend>
            <Container>
              <Text>{request.seller?.name}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2">
            <legend className="mb-2">Parent category name</legend>
            <Container>
              <Text>{parent_category_name}</Text>
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
