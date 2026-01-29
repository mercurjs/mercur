import { InformationCircle } from "@medusajs/icons";
import type { ProductDTO } from "@medusajs/types";
import { Button, Container, Drawer, Text } from "@medusajs/ui";

import { formatDate } from "@lib/date";
import { useNavigate } from "react-router-dom";

import type { AdminRequest } from "@custom-types/requests";

type Props = {
  request?: AdminRequest;
  open: boolean;
  close: () => void;
};

export function ProductSummaryDetail({ request, open, close }: Props) {
  if (!request) {
    return null;
  }

  const product_id = (request.data as Record<string, unknown>).product_id || "";
  const navigate = useNavigate();
  const requestData = request.data as ProductDTO;

  return (
    <Drawer open={open} onOpenChange={close} data-testid={`product-summary-detail-${request.id}`}>
      <Drawer.Content data-testid={`product-summary-detail-${request.id}-content`}>
        <Drawer.Header data-testid={`product-summary-detail-${request.id}-header`}>
          <Drawer.Title data-testid={`product-summary-detail-${request.id}-title`}>Product request</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="p-4" data-testid={`product-summary-detail-${request.id}-body`}>
          <fieldset data-testid={`product-summary-detail-${request.id}-product-title-fieldset`}>
            <legend className="mb-2" data-testid={`product-summary-detail-${request.id}-product-title-legend`}>Product title</legend>
            <Container data-testid={`product-summary-detail-${request.id}-product-title-container`}>
              <Text data-testid={`product-summary-detail-${request.id}-product-title-value`}>{requestData.title}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2" data-testid={`product-summary-detail-${request.id}-handle-fieldset`}>
            <legend className="mb-2" data-testid={`product-summary-detail-${request.id}-handle-legend`}>Handle</legend>
            <Container data-testid={`product-summary-detail-${request.id}-handle-container`}>
              <Text data-testid={`product-summary-detail-${request.id}-handle-value`}>{`/${requestData.handle}`}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2" data-testid={`product-summary-detail-${request.id}-submitted-by-fieldset`}>
            <legend className="mb-2" data-testid={`product-summary-detail-${request.id}-submitted-by-legend`}>Submitted by</legend>
            <Container data-testid={`product-summary-detail-${request.id}-submitted-by-container`}>
              <Text data-testid={`product-summary-detail-${request.id}-submitted-by-value`}>{request.seller?.name}</Text>
            </Container>
          </fieldset>
          <Container className="mt-4" data-testid={`product-summary-detail-${request.id}-request-information`}>
            <div className="flex items-center gap-2" data-testid={`product-summary-detail-${request.id}-request-information-header`}>
              <InformationCircle />
              <Text className="font-semibold" data-testid={`product-summary-detail-${request.id}-request-information-title`}>Request information</Text>
            </div>
            <Text data-testid={`product-summary-detail-${request.id}-submitted-on`}>{`Submitted on ${formatDate(request.created_at)}`}</Text>
            {request.reviewer_id && (
              <Text data-testid={`product-summary-detail-${request.id}-reviewed-on`}>{`Reviewed on ${formatDate(request.updated_at)}`}</Text>
            )}
            {request.reviewer_note && (
              <Text data-testid={`product-summary-detail-${request.id}-reviewer-note`}>{`Reviewer note: ${request.reviewer_note}`}</Text>
            )}
          </Container>
        </Drawer.Body>
        <Drawer.Footer data-testid={`product-summary-detail-${request.id}-footer`}>
          <Button
            onClick={() => {
              navigate(`/products/${product_id}`);
            }}
            data-testid={`product-summary-detail-${request.id}-see-full-product-button`}
          >
            See full product
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
}
